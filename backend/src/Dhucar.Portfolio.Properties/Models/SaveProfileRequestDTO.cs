using Dhucar.Portfolio.Properties.Documents;

namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Replaces the profile.
 */
public class SaveProfileRequestDTO
{
    /// <summary>The full profile.</summary>
    public ProfileDocument Profile { get; set; } = new();
}
