using System.Collections.Concurrent;

namespace Dhucar.Portfolio.BusinessLogic.Presence;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Who is reading which post right now: connection to post and scroll position, in memory only.
 *                    Nothing about the reader is kept; it all disappears when they leave.
 */
public class PresenceTracker
{
    /// <summary>Above this many open connections, new readers are simply not counted.</summary>
    public const int MaxConnections = 5000;

    /// <summary>Positions sent per post; enough dots for a busy article without a huge message.</summary>
    public const int MaxPositions = 50;

    private readonly ConcurrentDictionary<string, Reader> _readers = new();
    private readonly ConcurrentDictionary<string, byte> _dirty = new();

    /// <summary>One open page: the post it is on, how far down it is, and when it last spoke.</summary>
    private sealed class Reader
    {
        public required string Slug { get; init; }
        public int Position { get; set; }
        public long LastMoveTicks { get; set; }
        public long LastReactionTicks { get; set; }
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Join
    // Method Description    :   Puts a connection on a post (leaving any other post first); false when full.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   connectionId, slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Join : </c> Puts a connection on a post (leaving any other post first); false when full.
    /// </summary>
    public bool Join(string connectionId, string slug)
    {
        Leave(connectionId);
        if (_readers.Count >= MaxConnections)
        {
            return false;
        }
        _readers[connectionId] = new Reader { Slug = slug };
        _dirty[slug] = 0;
        return true;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Leave
    // Method Description    :   Removes a connection; returns the post it was on, if any.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   connectionId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string?
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Leave : </c> Removes a connection; returns the post it was on, if any.
    /// </summary>
    public string? Leave(string connectionId)
    {
        if (!_readers.TryRemove(connectionId, out Reader? reader))
        {
            return null;
        }
        _dirty[reader.Slug] = 0;
        return reader.Slug;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Move
    // Method Description    :   Records how far down the post a reader is (0-100), at most four times a second.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   connectionId, position, nowTicks
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Move : </c> Records how far down the post a reader is (0-100), at most four times a second.
    /// </summary>
    public bool Move(string connectionId, int position, long nowTicks)
    {
        if (!_readers.TryGetValue(connectionId, out Reader? reader) || nowTicks - reader.LastMoveTicks < TimeSpan.TicksPerSecond / 4)
        {
            return false;
        }
        reader.LastMoveTicks = nowTicks;
        reader.Position = Math.Clamp(position, 0, 100);
        _dirty[reader.Slug] = 0;
        return true;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   TryReact
    // Method Description    :   The post a reader may send a live reaction to, at most one a second; null otherwise.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   connectionId, nowTicks
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string?
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>TryReact : </c> The post a reader may send a live reaction to, at most one a second; null otherwise.
    /// </summary>
    public string? TryReact(string connectionId, long nowTicks)
    {
        if (!_readers.TryGetValue(connectionId, out Reader? reader) || nowTicks - reader.LastReactionTicks < TimeSpan.TicksPerSecond)
        {
            return null;
        }
        reader.LastReactionTicks = nowTicks;
        return reader.Slug;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Snapshot
    // Method Description    :   How many are on a post and where they are, sorted (no way to tell who is who).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   PresenceSnapshot
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Snapshot : </c> How many are on a post and where they are, sorted (no way to tell who is who).
    /// </summary>
    public PresenceSnapshot Snapshot(string slug)
    {
        List<int> positions = _readers.Values.Where(x => x.Slug == slug).Select(x => x.Position).ToList();
        positions.Sort();
        return new PresenceSnapshot(positions.Count, positions.Take(MaxPositions).ToArray());
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   TakeChanged
    // Method Description    :   The posts whose readers changed since the last call, clearing the list.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List<string>
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>TakeChanged : </c> The posts whose readers changed since the last call, clearing the list.
    /// </summary>
    public List<string> TakeChanged()
    {
        List<string> changed = [];
        foreach (string slug in _dirty.Keys)
        {
            if (_dirty.TryRemove(slug, out _))
            {
                changed.Add(slug);
            }
        }
        return changed;
    }
}

/// <summary>What everyone on a post is sent: the reader count and their scroll positions (0-100).</summary>
public record PresenceSnapshot(int Count, int[] Positions);
