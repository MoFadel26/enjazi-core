using Enjazi.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Enjazi.Api.Data.Configurations;

public sealed class CalendarEventConfiguration : IEntityTypeConfiguration<CalendarEvent>
{
    public void Configure(EntityTypeBuilder<CalendarEvent> builder)
    {
        builder.ToTable("events");
        builder.Property(e => e.Title).HasMaxLength(200);
        builder.Property(e => e.Description).HasMaxLength(2000);

        builder.HasOne(e => e.Owner)
            .WithMany(u => u.Events)
            .HasForeignKey(e => e.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.OwnerId, e.StartsAt });
    }
}
