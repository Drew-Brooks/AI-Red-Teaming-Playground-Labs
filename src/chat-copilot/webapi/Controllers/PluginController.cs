﻿// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using CopilotChat.WebApi.Auth;
using CopilotChat.WebApi.Hubs;
using CopilotChat.WebApi.Models.Storage;
using CopilotChat.WebApi.Options;
using CopilotChat.WebApi.Storage;
using CopilotChat.WebApi.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel.Diagnostics;

namespace CopilotChat.WebApi.Controllers;

/// <summary>
/// Controller responsible for returning the service options to the client.
/// </summary>
[ApiController]
public class PluginController : ControllerBase
{
    private const string PluginStateChanged = "PluginStateChanged";
    private readonly ILogger<PluginController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IDictionary<string, Plugin> _availablePlugins;
    private readonly ChatSessionRepository _sessionRepository;

    public PluginController(
        ILogger<PluginController> logger,
        IHttpClientFactory httpClientFactory,
        IDictionary<string, Plugin> availablePlugins,
        ChatSessionRepository sessionRepository)
    {
        this._logger = logger;
        this._httpClientFactory = httpClientFactory;
        this._availablePlugins = availablePlugins;
        this._sessionRepository = sessionRepository;
    }

    /// <summary>
    /// Fetches a plugin's manifest.
    /// </summary>
    /// <param name="manifestDomain">The domain of the manifest.</param>
    /// <returns>The plugin's manifest JSON.</returns>
    [HttpGet]
    [Route("pluginManifests")]
    [Authorize(AuthzChallenge.Plugins)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPluginManifest([FromQuery] Uri manifestDomain)
    {
        //TODO should use the name and return the json file accordingly no http requests.

        using var request = new HttpRequestMessage(HttpMethod.Get, PluginUtils.GetPluginManifestUri(manifestDomain));
        // Need to set the user agent to avoid 403s from some sites.
        request.Headers.Add("User-Agent", Telemetry.HttpUserAgent);

        using HttpClient client = this._httpClientFactory.CreateClient("Plugin");
        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            return this.StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync());
        }

        return this.Ok(await response.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// Enable or disable a plugin for a chat session.
    /// </summary>
    [HttpPut]
    [Route("chats/{chatId:guid}/plugins/{pluginName}/{enabled:bool}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(AuthzChallenge.PluginsControl)]
    [Authorize(AuthzChallenge.Plugins)]
    [Authorize(Policy = AuthPolicyName.RequireChatParticipant)]
    public async Task<IActionResult> SetPluginStateAsync(
        [FromServices] IHubContext<MessageRelayHub> messageRelayHubContext,
        Guid chatId,
        string pluginName,
        bool enabled)
    {
        if (!this._availablePlugins.ContainsKey(pluginName))
        {
            return this.NotFound("Plugin not found.");
        }

        var chatIdString = chatId.ToString();
        ChatSession? chat = null;
#pragma warning disable CA1508 // Avoid dead conditional code. It's giving out false positives on chat == null.
        if (!(await this._sessionRepository.TryFindByIdAsync(chatIdString, callback: v => chat = v)) || chat == null)
        {
            return this.NotFound("Chat not found.");
        }

        if (chat != null && chat.IsDeleted)
        {
            return this.NotFound("Chat is deleted");
        }

        if (enabled)
        {
            chat!.EnabledPlugins.Add(pluginName);
        }
        else
        {
            chat!.EnabledPlugins.Remove(pluginName);
        }

        await this._sessionRepository.UpsertAsync(chat);
        await messageRelayHubContext.Clients.Group(chatIdString).SendAsync(PluginStateChanged, chatIdString, pluginName, enabled);

        return this.NoContent();
    }
}
