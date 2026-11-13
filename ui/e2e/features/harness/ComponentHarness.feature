@animals @harness @component
Feature: Component test harness
  Switch, Tag Input, boolean cells and EntityGrid row-actions on /examples/test-harness.
  No test-data reset (harness holds local React state only).

  Background:
    Given I open the component test harness

  @T-ANIMAL-006/S1
  Scenario: Switch renders and binds a boolean
    Then the harness form isFurry switch is off
    And the harness json form isFurry readout is "false"
    When I turn the harness form isFurry switch on
    Then the harness json form isFurry readout is "true"
    And the harness switch is off
    And the harness switch value readout is "false"
    When I turn the harness switch on
    Then the harness switch is on
    And the harness switch value readout is "true"

  @T-ANIMAL-006/S2
  Scenario: Tag Input adds and removes chips
    When I add harness attribute tags "nocturnal,endangered & rare"
    Then the harness json form attributes readout is "[\"nocturnal\",\"endangered & rare\"]"
    When I remove the harness attribute tag at index 0
    Then the harness json form attributes readout is "[\"endangered & rare\"]"
    When I remove the harness attribute tag at index 0
    Then the harness json form attributes readout is "[]"

  @T-ANIMAL-006/S4
  Scenario: Read-only Switch and Tag Input
    Then the harness read-only switch cannot be toggled
    When I enable harness form read-only
    Then the harness json form switch cannot be toggled
    And the harness json form attributes have no add or remove controls

  @T-ANIMAL-007/S3
  Scenario: Items are hidden without the required permission
    When I set harness permissions via "harness-perm-usermgmt"
    And I open harness grid "harness-grid-permissions" row 0 actions
    Then the open actions menu lists "Open"
    And the open actions menu does not list "Edit Animal,Delete Animal,View report"

  @T-ANIMAL-007/S4
  Scenario: Any one of several permissions is enough
    When I set harness permissions via "harness-perm-animals"
    And I open harness grid "harness-grid-permissions" row 0 actions
    Then the open actions menu lists "Edit Animal,Delete Animal,Open,View report"
    When I set harness permissions via "harness-perm-reports"
    And I open harness grid "harness-grid-permissions" row 1 actions
    Then the open actions menu lists "Open,View report"

  @T-ANIMAL-007/S5
  Scenario: No Actions column when no item is allowed
    When I set harness permissions via "harness-perm-none"
    Then harness grid "harness-grid-all-require" has no Actions column

  @T-ANIMAL-007/S6
  Scenario: Per-row visibility hides Delete for Bessie
    When I set harness permissions via "harness-perm-animals"
    And I open harness grid "harness-grid-per-row" row 0 actions
    Then the open actions menu lists "Edit Animal"
    And the open actions menu does not list "Delete Animal"
    When I open harness grid "harness-grid-per-row" row 1 actions
    Then the open actions menu lists "Edit Animal,Delete Animal"

  @T-ANIMAL-007/S7
  Scenario: A row with no visible items has no trigger
    When I set harness permissions via "harness-perm-animals"
    Then harness grid "harness-grid-zero-visible" row 0 has no actions trigger
    And harness grid "harness-grid-zero-visible" row 1 has an actions trigger

  @T-ANIMAL-009/S4
  Scenario: Boolean labels are configurable with Yes/No defaults
    Then the harness bool "harness-bool-true" is named "Yes" with value "true"
    And the harness bool "harness-bool-false" is named "No" with value "false"
    And the harness bool "harness-bool-custom-true" is named "Furry" with value "true"
    And the harness bool "harness-bool-custom-false" is named "Not furry" with value "false"

  @T-ANIMAL-009/S5
  Scenario: Null and undefined show em dash named Not set
    Then the harness bool "harness-bool-null" is named "Not set" with value "null"
    And the harness bool "harness-bool-undefined" is named "Not set" with value "null"
    And the harness bool "harness-bool-null" shows an em dash with no circle

  @T-ANIMAL-009/S6
  Scenario: Existing switch cell still available
    Then the harness bool switch cell is a read-only switch
