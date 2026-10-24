namespace Magnetrail.BuildingBlocks;

public static class ValidationRules
{
    public static bool IsUsername(string value)
    {
        var username = value.Trim();
        return username.Length is >= 3 and <= 32 && username.All(character => char.IsLetterOrDigit(character) || character is '_' or '-');
    }
}
