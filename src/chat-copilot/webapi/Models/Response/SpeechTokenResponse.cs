﻿// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

namespace CopilotChat.WebApi.Models.Response;

/// <summary>
/// Token Response is a simple wrapper around the token and region
/// </summary>
public class SpeechTokenResponse
{
    public string? Token { get; set; }
    public string? Region { get; set; }
    public bool? IsSuccess { get; set; }
}
