using System.Text.Json;
using System.Text.Json.Serialization;

namespace Enjazi.Api.Tests;

public static class Json
{
    /// <summary>
    /// The API writes enums as their names. System.Net.Http.Json's default
    /// options do not read those back, so responses carrying an enum are
    /// read with these.
    /// </summary>
    public static readonly JsonSerializerOptions Web = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };
}
