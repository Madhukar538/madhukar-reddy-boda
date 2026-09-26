namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Single-use recovery codes; shown once, store them offline.
 */
public class RecoveryCodesDTO
{
    /// <summary>Recovery codes.</summary>
    public List<string> RecoveryCodes { get; set; } = new();
}
