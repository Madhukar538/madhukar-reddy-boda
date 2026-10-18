namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Adds or removes one reaction on a post.
 */
public class ReactToPostRequestDTO
{
    /// <summary>Post slug.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>like, idea, fire or love.</summary>
    public string Reaction { get; set; } = string.Empty;

    /// <summary>True to add the reaction, false to take it back.</summary>
    public bool IsAdded { get; set; }
}
