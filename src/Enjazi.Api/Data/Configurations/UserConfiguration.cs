using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Enjazi.Api.Data.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.Property(u => u.DisplayName).HasMaxLength(100);
    }
}

/// <summary>
/// Identity's default table names are AspNetUsers, AspNetRoles and so on.
/// Renamed so the schema reads as this application's, not the framework's.
/// </summary>
public sealed class IdentityTableConfiguration :
    IEntityTypeConfiguration<Role>,
    IEntityTypeConfiguration<IdentityUserRole<Guid>>,
    IEntityTypeConfiguration<IdentityUserClaim<Guid>>,
    IEntityTypeConfiguration<IdentityUserLogin<Guid>>,
    IEntityTypeConfiguration<IdentityUserToken<Guid>>,
    IEntityTypeConfiguration<IdentityRoleClaim<Guid>>
{
    // Identity declares the user foreign keys before the table is renamed, so
    // their constraint names would otherwise read fk_..._asp_net_users_...
    public void Configure(EntityTypeBuilder<Role> b) => b.ToTable("roles");

    public void Configure(EntityTypeBuilder<IdentityRoleClaim<Guid>> b) => b.ToTable("role_claims");

    public void Configure(EntityTypeBuilder<IdentityUserRole<Guid>> b)
    {
        b.ToTable("user_roles");
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId)
            .HasConstraintName("fk_user_roles_users_user_id");
    }

    public void Configure(EntityTypeBuilder<IdentityUserClaim<Guid>> b)
    {
        b.ToTable("user_claims");
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId)
            .HasConstraintName("fk_user_claims_users_user_id");
    }

    public void Configure(EntityTypeBuilder<IdentityUserLogin<Guid>> b)
    {
        b.ToTable("user_logins");
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId)
            .HasConstraintName("fk_user_logins_users_user_id");
    }

    public void Configure(EntityTypeBuilder<IdentityUserToken<Guid>> b)
    {
        b.ToTable("user_tokens");
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId)
            .HasConstraintName("fk_user_tokens_users_user_id");
    }
}
