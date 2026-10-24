using Magnetrail.Modules.Regulations;
using Xunit;

namespace Magnetrail.Api.Tests;

public sealed class RegulationClassificationTests
{
    [Fact]
    public void Unknown_is_not_allowed()
    {
        Assert.NotEqual("ALLOWED", RegulationClassification.Unknown);
        Assert.NotEqual(RegulationClassification.InformationOnly, RegulationClassification.Unknown);
    }

    [Fact]
    public void Published_classifications_are_explicit()
    {
        Assert.Equal("PROHIBITED", RegulationClassification.Prohibited);
        Assert.Equal("RESTRICTED", RegulationClassification.Restricted);
        Assert.Equal("INFORMATION_ONLY", RegulationClassification.InformationOnly);
    }
}
