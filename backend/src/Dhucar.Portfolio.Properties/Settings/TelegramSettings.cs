namespace Dhucar.Portfolio.Properties.Settings;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Optional Telegram bot for new-comment alerts; empty values turn alerts off.
 */
public class TelegramSettings
{
    /// <summary>Bot token from BotFather.</summary>
    public string BotToken { get; set; } = string.Empty;

    /// <summary>Chat that receives the alerts.</summary>
    public string ChatId { get; set; } = string.Empty;
}
