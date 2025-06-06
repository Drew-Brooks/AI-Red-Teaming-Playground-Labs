// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BaseService } from './BaseService';

export interface MaintenanceStatus {
    title: string | null;
    message: string | null;
    note: string | null | undefined;
}

export class MaintenanceService extends BaseService {
    public getMaintenanceStatus = async (accessToken: string) => {
        const result = await this.getResponseAsync<MaintenanceStatus>(
            {
                commandPath: 'maintenanceStatus',
            },
            accessToken,
        );

        return result;
    };
}
