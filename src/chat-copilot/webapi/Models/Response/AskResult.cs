﻿// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;

namespace CopilotChat.WebApi.Models.Response;

public class AskResult
{
    public string Value { get; set; } = string.Empty;

    public IEnumerable<KeyValuePair<string, string>>? Variables { get; set; } = Enumerable.Empty<KeyValuePair<string, string>>();
}
