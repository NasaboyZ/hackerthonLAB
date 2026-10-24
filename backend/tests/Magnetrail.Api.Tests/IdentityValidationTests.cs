using Magnetrail.BuildingBlocks;
using Xunit;

namespace Magnetrail.Api.Tests;

public sealed class IdentityValidationTests
{
    [Theory]
    [InlineData("RiverHunter")]
    [InlineData("Alpen_Explorer-1")]
    public void Username_rules_accept_valid_names(string value) => Assert.True(ValidationRules.IsUsername(value));

    [Theory]
    [InlineData("ab")]
    [InlineData("name with spaces")]
    [InlineData("name!")]
    public void Username_rules_reject_invalid_names(string value) => Assert.False(ValidationRules.IsUsername(value));
}
