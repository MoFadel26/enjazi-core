using Enjazi.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Enjazi.Api.Data.Configurations;

public sealed class UserSettingsConfiguration : IEntityTypeConfiguration<UserSettings>
{
    public void Configure(EntityTypeBuilder<UserSettings> builder)
    {
        builder.ToTable("settings");
        builder.HasKey(s => s.UserId);

        builder.HasOne(s => s.User)
            .WithOne(u => u.Settings)
            .HasForeignKey<UserSettings>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // One jsonb column holding the whole tree. See ADR-0002.
        builder.ComplexProperty(s => s.Data, data => data.ToJson());
    }
}

public sealed class StreakConfiguration : IEntityTypeConfiguration<Streak>
{
    public void Configure(EntityTypeBuilder<Streak> builder)
    {
        builder.ToTable("streaks");
        builder.HasKey(s => s.UserId);

        builder.HasOne(s => s.User)
            .WithOne(u => u.Streak)
            .HasForeignKey<Streak>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
