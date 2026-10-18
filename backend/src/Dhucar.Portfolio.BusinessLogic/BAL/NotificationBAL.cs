using System.Net;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Sends short alerts to the owner over Telegram; does nothing when no bot is configured.
 */
public class NotificationBAL(IHttpClientFactory httpClientFactory, IOptions<PortfolioSettings> options, ICodeLogger codeLog)
{
    /// <summary>Named HttpClient for the Telegram Bot API.</summary>
    public const string HttpClientName = "telegram";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SendAlert
    // Method Description    :   Posts an HTML-formatted message to the configured chat; failures are logged, never thrown.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   html
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SendAlert : </c> Posts an HTML-formatted message to the configured chat; failures are logged, never thrown.
    /// </summary>
    public async Task<bool> SendAlert(string html)
    {
        TelegramSettings telegram = options.Value.Telegram;
        if (telegram.BotToken.Length == 0 || telegram.ChatId.Length == 0)
        {
            return false;
        }
        try
        {
            using FormUrlEncodedContent content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["chat_id"] = telegram.ChatId,
                ["text"] = html,
                ["parse_mode"] = "HTML",
                ["disable_web_page_preview"] = "true",
            });
            HttpResponseMessage response = await httpClientFactory.CreateClient(HttpClientName)
                .PostAsync($"https://api.telegram.org/bot{telegram.BotToken}/sendMessage", content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            codeLog.Error(ex, "Step SendAlert", string.Empty, nameof(SendAlert));
            return false;
        }
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Escape
    // Method Description    :   Escapes text for Telegram HTML messages.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   text
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Escape : </c> Escapes text for Telegram HTML messages.
    /// </summary>
    public static string Escape(string text)
    {
        return WebUtility.HtmlEncode(text);
    }
}
