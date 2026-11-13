namespace Fish.Api.Services.TestData;

public sealed class TestDataConflictException(string message) : InvalidOperationException(message);

public sealed class TestDataDisabledException(string message) : InvalidOperationException(message);
