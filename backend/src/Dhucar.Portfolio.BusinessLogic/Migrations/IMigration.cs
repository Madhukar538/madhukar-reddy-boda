namespace Dhucar.Portfolio.BusinessLogic.Migrations;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  30 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  A one-off change to the stored data, applied on the first start of the release that ships it.
 */
public interface IMigration
{
    /// <summary>Unique and sortable: "NNNN-what-it-does" (next number up). Migrations run in Id order. Never rename one that has shipped.</summary>
    string Id { get; }

    /// <summary>One line on what it changes; stored with the record.</summary>
    string Description { get; }

    /// <summary>
    /// Changes the data and returns the site cache tags to refresh (e.g. "profile").
    /// Must be safe to run twice: a crash after applying but before recording runs it again.
    /// </summary>
    Task<IReadOnlyList<string>> Apply();
}
