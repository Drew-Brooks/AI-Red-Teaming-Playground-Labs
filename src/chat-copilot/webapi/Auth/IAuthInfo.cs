﻿// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

namespace CopilotChat.WebApi.Auth;

public interface IAuthInfo
{
    /// <summary>
    /// The authenticated user's unique ID.
    /// </summary>
    public string UserId { get; }

    /// <summary>
    /// The authenticated user's name.
    /// </summary>
    public string Name { get; }
}
