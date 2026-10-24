using Magnetrail.Modules.Findings;
using Xunit;

namespace Magnetrail.Api.Tests;

public sealed class FindingValidationTests
{
    [Fact]
    public void Finding_rules_accept_valid_metadata_and_location()
    {
        Assert.True(FindingRules.IsValidTitle("Alter Schlüssel"));
        Assert.True(FindingRules.IsValidDescription("Am Rhein gefunden"));
        Assert.True(FindingRules.IsValidWeight(250));
        Assert.True(FindingRules.IsValidLocation(7.59, 47.56));
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void Finding_rules_reject_missing_title(string value) => Assert.False(FindingRules.IsValidTitle(value));

    [Fact]
    public void Finding_rules_reject_invalid_weight_and_partial_location()
    {
        Assert.False(FindingRules.IsValidWeight(-1));
        Assert.False(FindingRules.IsValidLocation(7.59, null));
    }
}
