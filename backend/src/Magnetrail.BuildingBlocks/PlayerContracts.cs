using System.Security.Claims;

namespace Magnetrail.BuildingBlocks;

public sealed record PlayerProfileSnapshot(Guid UserId, string Username, int Level, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

public interface IPlayerProfileProvisioner
{
    Task<bool> CreateAsync(Guid userId, string username, CancellationToken cancellationToken);
}

public interface IPlayerProfileReader
{
    Task<PlayerProfileSnapshot?> GetAsync(Guid userId, CancellationToken cancellationToken);
}

public static class AuthenticatedUser
{
    public static Guid? GetId(ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var id) ? id : null;
    }
}
