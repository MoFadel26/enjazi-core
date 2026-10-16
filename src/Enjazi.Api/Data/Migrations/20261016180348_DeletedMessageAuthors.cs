using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Enjazi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class DeletedMessageAuthors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_messages_users_author_id",
                table: "messages");

            migrationBuilder.AlterColumn<Guid>(
                name: "author_id",
                table: "messages",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "fk_messages_users_author_id",
                table: "messages",
                column: "author_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // author_id becomes NOT NULL again, which messages from deleted
            // accounts would violate.
            migrationBuilder.Sql("DELETE FROM messages WHERE author_id IS NULL;");

            migrationBuilder.DropForeignKey(
                name: "fk_messages_users_author_id",
                table: "messages");

            migrationBuilder.AlterColumn<Guid>(
                name: "author_id",
                table: "messages",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "fk_messages_users_author_id",
                table: "messages",
                column: "author_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
