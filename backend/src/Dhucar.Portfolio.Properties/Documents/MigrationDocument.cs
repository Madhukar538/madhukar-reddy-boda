using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  30 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One data migration that has run against this database, so it never runs twice.
 */
[BsonIgnoreExtraElements]
public class MigrationDocument
{
    /// <summary>Migration id, e.g. "2026-10-30-senior-title-and-maf"; sorts in the order they run.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>What it changed, for anyone reading the collection.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>UTC time it ran.</summary>
    public DateTime AppliedAt { get; set; }
}
