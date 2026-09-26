namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Uniform response envelope returned by every API action.
 */
public class Response<T>
{
    /// <summary>Outcome code; see ErrorCode (1 is success, negatives are failures).</summary>
    public int ReturnCode { get; set; }

    /// <summary>Human-readable outcome. Never contains secrets or stack traces.</summary>
    public string ReturnMessage { get; set; } = string.Empty;

    /// <summary>Payload for successful calls.</summary>
    public T? Data { get; set; }

    /// <summary>Server processing time in milliseconds.</summary>
    public string ResponseTime { get; set; } = string.Empty;

    /// <summary>UTC time the response was produced.</summary>
    public DateTime ServerDate { get; set; }

    /// <summary>Number of rows in Data for list responses.</summary>
    public long RowCount { get; set; }
}
