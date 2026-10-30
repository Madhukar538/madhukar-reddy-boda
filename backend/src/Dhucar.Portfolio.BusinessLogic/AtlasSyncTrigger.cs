using System.Threading.Channels;

namespace Dhucar.Portfolio.BusinessLogic;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  30 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Lets any part of the API ask for an immediate Atlas access-list sync (e.g. the moment MongoDB
 *                    stops answering), instead of waiting for the next scheduled check. Requests made while one is
 *                    already pending collapse into one. Singleton.
 */
public class AtlasSyncTrigger
{
    private readonly Channel<bool> _requests = Channel.CreateBounded<bool>(new BoundedChannelOptions(1) { FullMode = BoundedChannelFullMode.DropWrite });

    /// <summary>Asks for a sync as soon as possible. Never blocks.</summary>
    public void Request()
    {
        _requests.Writer.TryWrite(true);
    }

    /// <summary>Waits up to <paramref name="timeout"/>; true if a sync was requested meanwhile.</summary>
    public async Task<bool> WaitAsync(TimeSpan timeout, CancellationToken cancellationToken)
    {
        using CancellationTokenSource window = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        window.CancelAfter(timeout);
        try
        {
            return await _requests.Reader.ReadAsync(window.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return false;
        }
    }
}
