import {
  SystemJsonSchema,
  SystemJsonSchemaConditionalRequiredRule,
  SystemJsonSchemaConstraint,
  SystemJsonSchemaFormTab,
  SystemJsonSchemaIfProperty,
  SystemJsonSchemaMessages,
  SystemJsonSchemaOneOfOption,
  SystemJsonSchemaProperty,
  SystemJsonSchemaThenProperty,
  SystemJsonSchemaDependentLookup,
  SystemJsonSchemaFileUpload,
} from '../models/system-json-schema.model';

function readRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value);
}

function toCamelCaseKey(key: string): string {
  if (!key.length) {
    return key;
  }

  return key.charAt(0).toLowerCase() + key.slice(1);
}

function readSchemaType(value: unknown): SystemJsonSchemaProperty['type'] {
  // Nullable properties declare a union, e.g. `["integer", "null"]`; the non-null entry is the real type.
  const declared = Array.isArray(value)
    ? value.map((entry) => readString(entry)).find((entry) => entry.toLowerCase() !== 'null')
    : value;
  const normalized = readString(declared, 'string').toLowerCase();

  if (
    normalized === 'string' ||
    normalized === 'integer' ||
    normalized === 'number' ||
    normalized === 'array' ||
    normalized === 'object' ||
    normalized === 'boolean'
  ) {
    return normalized;
  }

  return 'string';
}

function normalizeOneOfOption(raw: unknown): SystemJsonSchemaOneOfOption {
  const record = readRecord(raw);

  const enumValues = record['enum'] ?? record['Enum'];
  const enumConst =
    Array.isArray(enumValues) && enumValues.length === 1 ? readString(enumValues[0]) : '';

  const option: SystemJsonSchemaOneOfOption = {
    const: readString(record['const'] ?? record['Const'] ?? enumConst),
    title: readString(record['title'] ?? record['Title']),
  };

  const description = record['description'] ?? record['Description'];
  if (description != null && readString(description)) {
    option.description = readString(description);
  }

  const icon = record['icon'] ?? record['Icon'];
  if (icon != null && readString(icon)) {
    option.icon = readString(icon);
  }

  const children = record['children'] ?? record['Children'];
  if (Array.isArray(children) && children.length) {
    option.children = children
      .map((child) => {
        const childRecord = readRecord(child);
        const childConst = readString(childRecord['const'] ?? childRecord['Const']);
        if (!childConst) {
          return undefined;
        }

        return {
          const: childConst,
          title: readString(childRecord['title'] ?? childRecord['Title'], childConst),
        };
      })
      .filter((child): child is { const: string; title: string } => !!child);
  }

  return option;
}

function normalizeProperty(raw: unknown): SystemJsonSchemaProperty {
  const record = readRecord(raw);
  const nestedProperties = readRecord(record['properties'] ?? record['Properties']);
  const nestedItems = record['items'] ?? record['Items'];
  const oneOf = record['oneOf'] ?? record['OneOf'];
  const messages = record['messages'] ?? record['Messages'];

  const property: SystemJsonSchemaProperty = {
    title: readString(record['title'] ?? record['Title']),
    modelPropertyName: readString(
      record['modelPropertyName'] ?? record['ModelPropertyName'] ?? record['title'] ?? record['Title']
    ),
    type: readSchemaType(record['type'] ?? record['Type']),
  };

  if (record['maxLength'] != null || record['MaxLength'] != null) {
    property.maxLength = Number(record['maxLength'] ?? record['MaxLength']);
  }

  if (record['minLength'] != null || record['MinLength'] != null) {
    property.minLength = Number(record['minLength'] ?? record['MinLength']);
  }

  if (record['minimum'] != null || record['Minimum'] != null) {
    property.minimum = Number(record['minimum'] ?? record['Minimum']);
  }

  if (record['maximum'] != null || record['Maximum'] != null) {
    property.maximum = Number(record['maximum'] ?? record['Maximum']);
  }

  if (record['minItems'] != null || record['MinItems'] != null) {
    property.minItems = Number(record['minItems'] ?? record['MinItems']);
  }

  if (record['maxItems'] != null || record['MaxItems'] != null) {
    property.maxItems = Number(record['maxItems'] ?? record['MaxItems']);
  }

  const defaultValue = record['default'] ?? record['Default'];
  if (defaultValue !== undefined) {
    property.default = defaultValue;
  }

  const constraints = normalizeConstraints(record['constraints'] ?? record['Constraints']);
  if (constraints) {
    property.constraints = constraints;
  }

  if (record['format'] != null || record['Format'] != null) {
    property.format = readString(record['format'] ?? record['Format']);
  }

  if (record['pattern'] != null || record['Pattern'] != null) {
    property.pattern = readString(record['pattern'] ?? record['Pattern']);
  }

  if (Array.isArray(oneOf) && oneOf.length) {
    property.oneOf = oneOf.map((option) => normalizeOneOfOption(option));
  }

  const dependentLookup = record['dependentLookup'] ?? record['DependentLookup'];
  if (dependentLookup != null && typeof dependentLookup === 'object') {
    property.dependentLookup = normalizeDependentLookup(dependentLookup);
  }

  const dataLookup = record['dataLookup'] ?? record['DataLookup'];
  if (dataLookup != null && readString(dataLookup)) {
    property.dataLookup = readString(dataLookup);
  }

  const fileUpload = record['fileUpload'] ?? record['FileUpload'];
  if (fileUpload != null && typeof fileUpload === 'object') {
    const normalized = normalizeFileUpload(fileUpload);
    if (normalized) {
      property.fileUpload = normalized;
    }
  }

  if (Array.isArray(messages) && messages.length) {
    property.messages = messages as SystemJsonSchemaProperty['messages'];
  }

  // Modal list item schemas carry their own conditional rules (e.g. Block Reference when Block Name is entered).
  const conditionalRequired =
    normalizeConditionalRequired(record['conditionalRequired'] ?? record['ConditionalRequired']) ??
    normalizeConditionalRequiredFromAllOf(record['allOf'] ?? record['AllOf']);
  if (conditionalRequired?.length) {
    property.conditionalRequired = conditionalRequired;
  }

  const required = excludeConditionallyRequiredKeys(
    resolveNormalizedRequired(record, nestedProperties),
    conditionalRequired,
    undefined
  );
  if (required?.length) {
    property.required = required;
  }

  if (Object.keys(nestedProperties).length > 0) {
    property.properties = Object.fromEntries(
      Object.entries(nestedProperties).map(([key, value]) => [toCamelCaseKey(key), normalizeProperty(value)])
    );
  }

  if (nestedItems != null) {
    property.items = normalizeProperty(nestedItems);
  }

  return property;
}

function normalizeConstraints(raw: unknown): SystemJsonSchemaConstraint[] | undefined {
  if (!Array.isArray(raw) || !raw.length) {
    return undefined;
  }

  const constraints = raw
    .map((entry): SystemJsonSchemaConstraint | null => {
      const record = readRecord(entry);
      const id = readString(record['id'] ?? record['Id']);
      const type = readString(record['type'] ?? record['Type']);
      if (!id || !type) {
        return null;
      }

      const compareTo = record['compareTo'] ?? record['CompareTo'];
      const operator = record['operator'] ?? record['Operator'];
      return {
        id,
        type,
        ...(compareTo != null ? { compareTo: readString(compareTo) } : {}),
        ...(operator != null ? { operator: readString(operator) } : {}),
      };
    })
    .filter((constraint): constraint is SystemJsonSchemaConstraint => constraint != null);

  return constraints.length ? constraints : undefined;
}

function normalizeFileUpload(raw: unknown): SystemJsonSchemaFileUpload | undefined {
  const record = readRecord(raw);
  const acceptRaw = record['accept'] ?? record['Accept'];
  const accept = Array.isArray(acceptRaw)
    ? acceptRaw.map((entry) => readString(entry)).filter(Boolean)
    : [];
  const createBodyRaw = record['createBody'] ?? record['CreateBody'];
  const createUrl = readString(record['createUrl'] ?? record['CreateUrl']);
  const uploadUrl = readString(record['uploadUrl'] ?? record['UploadUrl']);
  if (!createUrl && !uploadUrl) {
    return undefined;
  }

  return {
    createUrl,
    uploadUrl,
    ...(createBodyRaw != null && typeof createBodyRaw === 'object'
      ? { createBody: readRecord(createBodyRaw) }
      : {}),
    ...(record['metadataUrl'] != null || record['MetadataUrl'] != null
      ? { metadataUrl: readString(record['metadataUrl'] ?? record['MetadataUrl']) }
      : {}),
    ...(record['downloadUrl'] != null || record['DownloadUrl'] != null
      ? { downloadUrl: readString(record['downloadUrl'] ?? record['DownloadUrl']) }
      : {}),
    ...(record['deleteUrl'] != null || record['DeleteUrl'] != null
      ? { deleteUrl: readString(record['deleteUrl'] ?? record['DeleteUrl']) }
      : {}),
    ...(record['fileFieldName'] != null || record['FileFieldName'] != null
      ? { fileFieldName: readString(record['fileFieldName'] ?? record['FileFieldName']) }
      : {}),
    ...(accept.length ? { accept } : {}),
    ...(record['maxFiles'] != null || record['MaxFiles'] != null
      ? { maxFiles: Number(record['maxFiles'] ?? record['MaxFiles']) }
      : {}),
    ...(record['maxFileSize'] != null || record['MaxFileSize'] != null
      ? { maxFileSize: Number(record['maxFileSize'] ?? record['MaxFileSize']) }
      : {}),
    ...(record['uploadOnAttach'] === true || record['UploadOnAttach'] === true
      ? { uploadOnAttach: true }
      : {}),
  };
}

function normalizeDependentLookup(raw: unknown): SystemJsonSchemaDependentLookup {
  const record = readRecord(raw);
  const queryParamsRaw = readRecord(record['queryParams'] ?? record['QueryParams']);
  const queryParams = Object.keys(queryParamsRaw).length
    ? Object.fromEntries(
        Object.entries(queryParamsRaw).map(([key, value]) => [key, readString(value)])
      )
    : undefined;

  return {
    dependsOn: readString(record['dependsOn'] ?? record['DependsOn']),
    lookupPath: readString(record['lookupPath'] ?? record['LookupPath']),
    ...(queryParams ? { queryParams } : {}),
    ...(record['valueField'] != null || record['ValueField'] != null
      ? { valueField: readString(record['valueField'] ?? record['ValueField']) }
      : {}),
    ...(record['labelField'] != null || record['LabelField'] != null
      ? { labelField: readString(record['labelField'] ?? record['LabelField']) }
      : {}),
    ...(record['pageSize'] != null || record['PageSize'] != null
      ? { pageSize: Number(record['pageSize'] ?? record['PageSize']) }
      : {}),
  };
}

function normalizeProperties(raw: unknown): Record<string, SystemJsonSchemaProperty> {
  const record = readRecord(raw);

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [toCamelCaseKey(key), normalizeProperty(value)])
  );
}

function normalizeRequired(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const required = raw.map((value) => toCamelCaseKey(readString(value))).filter(Boolean);
  return required.length ? required : undefined;
}

function resolveNormalizedRequired(
  record: Record<string, unknown>,
  nestedProperties: Record<string, unknown>
): string[] | undefined {
  const requiredKeys = new Set(normalizeRequired(record['required'] ?? record['Required']) ?? []);

  for (const [key, propertyValue] of Object.entries(nestedProperties)) {
    const propertyRecord = readRecord(propertyValue);
    const requiredFlag = propertyRecord['required'] ?? propertyRecord['Required'];
    if (requiredFlag === true) {
      requiredKeys.add(toCamelCaseKey(key));
    }
  }

  return requiredKeys.size ? [...requiredKeys] : undefined;
}

function normalizeFormTabs(raw: unknown): SystemJsonSchemaFormTab[] | undefined {
  if (!Array.isArray(raw) || !raw.length) {
    return undefined;
  }

  const formTabs = raw
    .map((item) => {
      const record = readRecord(item);
      const tabProperties = record['properties'] ?? record['Properties'];
      const propertyKeys = Array.isArray(tabProperties)
        ? tabProperties.map((value) => toCamelCaseKey(readString(value))).filter(Boolean)
        : [];

      return {
        title: readString(record['title'] ?? record['Title'], 'Section'),
        properties: propertyKeys,
      };
    })
    .filter((tab) => tab.properties.length > 0);

  return formTabs.length ? formTabs : undefined;
}

/**
 * Normalizes System schema API payloads (camelCase or PascalCase, wrapped or bare).
 * Also accepts a JSON string body (some schema endpoints return a serialized schema string).
 */
export function mapSystemSchemaFromApi(response: unknown): SystemJsonSchema {
  const resolved = resolveSchemaPayload(response);
  if (!resolved || typeof resolved !== 'object') {
    throw new Error('Invalid schema response');
  }

  const record = resolved as Record<string, unknown>;
  const wrapped = record['data'] ?? record['Data'];
  const raw =
    typeof wrapped === 'string'
      ? parseJsonObject(wrapped)
      : wrapped && typeof wrapped === 'object'
        ? (wrapped as Record<string, unknown>)
        : record;

  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid schema response');
  }

  const conditionalRequired =
    normalizeConditionalRequired(raw['conditionalRequired'] ?? raw['ConditionalRequired']) ??
    normalizeConditionalRequiredFromAllOf(raw['allOf'] ?? raw['AllOf']);
  const legacyIf = normalizeIfCondition(raw['if'] ?? raw['If']);
  const legacyThen = normalizeThenClause(raw['then'] ?? raw['Then']);

  return {
    title: readString(raw['title'] ?? raw['Title'], 'Form'),
    type: 'object',
    properties: normalizeProperties(raw['properties'] ?? raw['Properties']),
    required: excludeConditionallyRequiredKeys(
      normalizeRequired(raw['required'] ?? raw['Required']),
      conditionalRequired,
      legacyThen
    ),
    formTabs: normalizeFormTabs(raw['formTabs'] ?? raw['FormTabs']),
    if: legacyIf,
    then: legacyThen,
    conditionalRequired,
  };
}

function resolveSchemaPayload(response: unknown): Record<string, unknown> | null {
  if (typeof response === 'string') {
    return parseJsonObject(response);
  }

  if (response && typeof response === 'object') {
    return response as Record<string, unknown>;
  }

  return null;
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function normalizeIfProperty(raw: unknown): SystemJsonSchemaIfProperty {
  const record = readRecord(raw);
  const property: SystemJsonSchemaIfProperty = {};

  const constValue = record['const'] ?? record['Const'];
  if (constValue != null) {
    property.const = readString(constValue);
  }

  const enumRaw = record['enum'] ?? record['Enum'];
  if (Array.isArray(enumRaw) && enumRaw.length > 0) {
    property.enum = enumRaw.map((value) => readString(value)).filter(Boolean);
  }

  const minLength = record['minLength'] ?? record['MinLength'];
  if (minLength != null) {
    property.minLength = Number(minLength);
  }

  return property;
}

function normalizeIfCondition(value: unknown): SystemJsonSchema['if'] {
  if (value == null || typeof value !== 'object') {
    return undefined;
  }

  const record = readRecord(value);
  const propertiesRaw = readRecord(record['properties'] ?? record['Properties']);
  const properties: Record<string, SystemJsonSchemaIfProperty> = {};

  for (const [key, propertyValue] of Object.entries(propertiesRaw)) {
    properties[toCamelCaseKey(key)] = normalizeIfProperty(propertyValue);
  }

  if (!Object.keys(properties).length) {
    return undefined;
  }

  const required = normalizeRequired(record['required'] ?? record['Required']);
  return {
    properties,
    ...(required ? { required } : {}),
  };
}

function normalizeThenClause(value: unknown): SystemJsonSchema['then'] {
  if (value == null || typeof value !== 'object') {
    return undefined;
  }

  const record = readRecord(value);
  const propertiesRaw = readRecord(record['properties'] ?? record['Properties']);
  const properties: Record<string, SystemJsonSchemaThenProperty> = {};

  for (const [key, propertyValue] of Object.entries(propertiesRaw)) {
    const propertyRecord = readRecord(propertyValue);
    const thenProperty: SystemJsonSchemaThenProperty = {};

    const requiredFlag = propertyRecord['required'] ?? propertyRecord['Required'];
    if (typeof requiredFlag === 'boolean') {
      thenProperty.required = requiredFlag;
    }

    if (propertyRecord['minItems'] != null || propertyRecord['MinItems'] != null) {
      thenProperty.minItems = Number(propertyRecord['minItems'] ?? propertyRecord['MinItems']);
    }
    if (propertyRecord['minLength'] != null || propertyRecord['MinLength'] != null) {
      thenProperty.minLength = Number(propertyRecord['minLength'] ?? propertyRecord['MinLength']);
    }
    if (propertyRecord['maxLength'] != null || propertyRecord['MaxLength'] != null) {
      thenProperty.maxLength = Number(propertyRecord['maxLength'] ?? propertyRecord['MaxLength']);
    }

    properties[toCamelCaseKey(key)] = thenProperty;
  }

  const messagesRaw = record['messages'] ?? record['Messages'];
  const messages = Array.isArray(messagesRaw)
    ? messagesRaw
        .map((entry) => {
          const messageRecord = readRecord(entry);
          const normalized: SystemJsonSchemaMessages = {};
          for (const [key, message] of Object.entries(messageRecord)) {
            if (message != null) {
              normalized[toCamelCaseKey(key)] = readString(message);
            }
          }
          return Object.keys(normalized).length ? normalized : null;
        })
        .filter((entry): entry is SystemJsonSchemaMessages => entry != null)
    : undefined;

  const required = normalizeRequired(record['required'] ?? record['Required']);
  if (!required?.length && !Object.keys(properties).length && !messages?.length) {
    return undefined;
  }

  return {
    ...(required ? { required } : {}),
    ...(Object.keys(properties).length ? { properties } : {}),
    ...(messages?.length ? { messages } : {}),
  };
}

function normalizeConditionalRequired(
  value: unknown
): SystemJsonSchemaConditionalRequiredRule[] | undefined {
  if (!Array.isArray(value) || !value.length) {
    return undefined;
  }

  const rules = value
    .map((entry): SystemJsonSchemaConditionalRequiredRule | null => {
      const record = readRecord(entry);
      const whenRecord = readRecord(record['when'] ?? record['When']);
      const property = toCamelCaseKey(
        readString(whenRecord['property'] ?? whenRecord['Property'])
      );
      const valuesRaw = whenRecord['values'] ?? whenRecord['Values'];
      const values = Array.isArray(valuesRaw)
        ? valuesRaw.map((item) => readString(item)).filter(Boolean)
        : [];
      const notEmpty = (whenRecord['notEmpty'] ?? whenRecord['NotEmpty']) === true;
      const requireRaw = record['require'] ?? record['Require'];
      const require = Array.isArray(requireRaw)
        ? requireRaw.map((item) => toCamelCaseKey(readString(item))).filter(Boolean)
        : [];

      if (!property || !require.length || (!notEmpty && !values.length)) {
        return null;
      }

      return {
        when: notEmpty ? { property, notEmpty: true } : { property, values },
        require,
      };
    })
    .filter((rule): rule is SystemJsonSchemaConditionalRequiredRule => rule != null);

  return rules.length ? rules : undefined;
}

/**
 * Converts standard JSON Schema `allOf` `if`/`then` pairs into System `conditionalRequired` rules.
 * Used when the API has not yet flattened them (or as a fallback).
 */
function normalizeConditionalRequiredFromAllOf(
  value: unknown
): SystemJsonSchemaConditionalRequiredRule[] | undefined {
  if (!Array.isArray(value) || !value.length) {
    return undefined;
  }

  const rules = value
    .map((entry): SystemJsonSchemaConditionalRequiredRule | null => {
      const record = readRecord(entry);
      const ifClause = normalizeIfCondition(record['if'] ?? record['If']);
      const thenClause = normalizeThenClause(record['then'] ?? record['Then']);
      if (!ifClause || !thenClause) {
        return null;
      }

      const ifEntries = Object.entries(ifClause.properties ?? {});
      if (!ifEntries.length) {
        return null;
      }

      const [property, match] = ifEntries[0];
      const values = match.enum?.length
        ? [...match.enum]
        : match.const
          ? [match.const]
          : [];
      // `minLength: 1` on the trigger means "any value entered" rather than a specific match.
      const notEmpty = !values.length && (match.minLength ?? 0) >= 1;

      const require = [
        ...new Set([
          ...(thenClause.required ?? []),
          ...Object.entries(thenClause.properties ?? {})
            .filter(([, prop]) => prop.required === true)
            .map(([key]) => key),
        ]),
      ];

      if (!property || !require.length || (!notEmpty && !values.length)) {
        return null;
      }

      return {
        when: notEmpty ? { property, notEmpty: true } : { property, values },
        require,
      };
    })
    .filter((rule): rule is SystemJsonSchemaConditionalRequiredRule => rule != null);

  return rules.length ? rules : undefined;
}

/**
 * Conditionally required fields must not stay in the root `required` array,
 * or JsonForms marks them always-required (e.g. email stays required after switching to Telephone).
 */
function excludeConditionallyRequiredKeys(
  required: string[] | undefined,
  conditionalRequired: SystemJsonSchemaConditionalRequiredRule[] | undefined,
  legacyThen: SystemJsonSchema['then']
): string[] | undefined {
  if (!required?.length) {
    return required;
  }

  const conditionalKeys = new Set<string>();

  for (const rule of conditionalRequired ?? []) {
    for (const key of rule.require) {
      conditionalKeys.add(key);
    }
  }

  if (!conditionalRequired?.length && legacyThen) {
    for (const key of legacyThen.required ?? []) {
      conditionalKeys.add(key);
    }
    for (const [key, property] of Object.entries(legacyThen.properties ?? {})) {
      if (property.required === true) {
        conditionalKeys.add(key);
      }
    }
  }

  if (!conditionalKeys.size) {
    return required;
  }

  const filtered = required.filter((key) => !conditionalKeys.has(key));
  return filtered.length ? filtered : undefined;
}
