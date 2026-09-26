namespace Dhucar.Portfolio.Tests.Infrastructure;

/// <summary>Real clock plus an offset tests can move forward, so each TOTP code can use a fresh time step.</summary>
public sealed class AdjustableTimeProvider : TimeProvider
{
    private TimeSpan _offset;

    public override DateTimeOffset GetUtcNow() => DateTimeOffset.UtcNow + _offset;

    public void Advance(TimeSpan by) => _offset += by;
}
