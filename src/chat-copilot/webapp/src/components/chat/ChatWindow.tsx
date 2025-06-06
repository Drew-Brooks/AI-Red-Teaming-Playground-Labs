// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    Button,
    Label,
    Persona,
    Popover,
    PopoverSurface,
    PopoverTrigger,
    SelectTabEventHandler,
    Tab,
    TabList,
    TabValue,
    Tooltip,
    makeStyles,
    shorthands,
    tokens
} from '@fluentui/react-components';
import { Edit24Filled, EditRegular, Map16Regular, NoteEdit20Regular, Person16Regular } from '@fluentui/react-icons';
import React, { useState } from 'react';
import { useAppSelector } from '../../redux/app/hooks';
import { RootState } from '../../redux/app/store';
import { FeatureKeys } from '../../redux/features/app/AppState';
import { Alerts } from '../shared/Alerts';
import { ChatRoom } from './ChatRoom';
import { ParticipantsList } from './controls/ParticipantsList';
import { ShareBotMenu } from './controls/ShareBotMenu';
import { EditChatName } from './shared/EditChatName';
import { DocumentsTab } from './tabs/DocumentsTab';
import { PersonaTab } from './tabs/PersonaTab';
import { PlansTab } from './tabs/PlansTab';
import { RagTab } from './tabs/RagTab';

const useClasses = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: tokens.colorNeutralBackground3,
        boxShadow: 'rgb(0 0 0 / 25%) 0 0.2rem 0.4rem -0.075rem',
    },
    header: {
        ...shorthands.borderBottom('1px', 'solid', 'rgb(0 0 0 / 10%)'),
        ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
        backgroundColor: tokens.colorNeutralBackground4,
        display: 'flex',
        flexDirection: 'row',
        boxSizing: 'border-box',
        width: '100%',
        justifyContent: 'space-between',
    },
    title: {
        ...shorthands.gap(tokens.spacingHorizontalM),
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
    },
    controls: {
        display: 'flex',
        alignItems: 'center',
    },
    popoverHeader: {
        ...shorthands.margin('0'),
        paddingBottom: tokens.spacingVerticalXXS,
        fontStyle: 'normal',
        fontWeight: '600',
    },
    popover: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        ...shorthands.padding(tokens.spacingVerticalXXL),
        ...shorthands.gap(tokens.spacingVerticalMNudge),
        width: '398px',
    },
    input: {
        width: '100%',
    },
    buttons: {
        display: 'flex',
        alignSelf: 'end',
        ...shorthands.gap(tokens.spacingVerticalS),
    },
    alerts: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.margin(0, '72px'),
    },
});

export const ChatWindow: React.FC = () => {
    const classes = useClasses();
    const { features, challengeSettings } = useAppSelector((state: RootState) => state.app);
    const { conversations, selectedId } = useAppSelector((state: RootState) => state.conversations);
    const showShareBotMenu = features[FeatureKeys.BotAsDocs].enabled || features[FeatureKeys.MultiUserChat].enabled;
    const chatName = conversations[selectedId].title;

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [selectedTab, setSelectedTab] = React.useState<TabValue>(features[FeatureKeys.RagInput].enabled ? 'rag' : 'chat');
    const [currentSelectedId, setCurrentSelectedId] = React.useState<string>('');
    const [chatDisabled, setChatDisabled] = React.useState<boolean>(false);

    const onTabSelect: SelectTabEventHandler = (_event, data) => {
        setSelectedTab(data.value);
    };

    React.useEffect(() => {
        if (features[FeatureKeys.RagInput].enabled) {
            if (currentSelectedId !== selectedId) {
                //We changed chat we need to set the tab bag to RAG.
                setCurrentSelectedId(selectedId);
                setSelectedTab('rag');
            }

            //Check if the user has sent a message already
            if (conversations[selectedId].messages.length > 1) {
                setChatDisabled(false);
            } else {
                setChatDisabled(true);
            }
        }
    }, [conversations, selectedId, currentSelectedId, features, challengeSettings])

    return (
        <div className={classes.root}>
            <div className={classes.header}>
                <div className={classes.title}>
                    {!features[FeatureKeys.SimplifiedExperience].enabled && (
                        <>
                            <Persona
                                key={'Semantic Kernel Bot'}
                                size="medium"
                                avatar={{ image: { src: conversations[selectedId].botProfilePicture } }}
                                presence={{ status: 'available' }}
                            />
                            <Label size="large" weight="semibold">
                                {chatName}
                            </Label>
                            <Popover open={isEditing}>
                                <PopoverTrigger disableButtonEnhancement>
                                    <Tooltip content={'Edit conversation name'} relationship="label">
                                        <Button
                                            data-testid="editChatTitleButton"
                                            icon={isEditing ? <Edit24Filled /> : <EditRegular />}
                                            appearance="transparent"
                                            onClick={() => {
                                                setIsEditing(true);
                                            }}
                                            disabled={!chatName}
                                            aria-label="Edit conversation name"
                                        />
                                    </Tooltip>
                                </PopoverTrigger>
                                <PopoverSurface className={classes.popover}>
                                    <h3 className={classes.popoverHeader}>Bot name</h3>
                                    <EditChatName
                                        name={chatName}
                                        chatId={selectedId}
                                        exitEdits={() => {
                                            setIsEditing(false);
                                        }}
                                        textButtons
                                    />
                                </PopoverSurface>
                            </Popover>
                        </>
                    )}
                    <TabList selectedValue={selectedTab} onTabSelect={onTabSelect}>
                        {features[FeatureKeys.RagInput].enabled && (
                            <>
                                <Tab
                                    data-testid="ragTab"
                                    id="rag"
                                    value="rag"
                                    icon={<NoteEdit20Regular />}
                                    aria-label={challengeSettings.ragInput.titleShort + " Tab"}
                                    title={challengeSettings.ragInput.titleShort + " Tab"}
                                >
                                    {challengeSettings.ragInput.titleShort}
                                </Tab>
                            </>
                        )}
                        <Tab data-testid="chatTab" id="chat" value="chat" aria-label="Chat Tab" title="Chat Tab" disabled={chatDisabled}>
                            Chat
                        </Tab>
                        {features[FeatureKeys.Documents].enabled && (
                            <>
                                <Tab
                                    data-testid="documentsTab"
                                    id="documents"
                                    value="documents"
                                    aria-label="Documents Tab"
                                    title="Documents Tab"
                                >
                                    Documents
                                </Tab>
                            </>
                        )}

                        {features[FeatureKeys.PluginsPlannersAndPersonas].enabled && (
                            <>
                                <Tab
                                    data-testid="plansTab"
                                    id="plans"
                                    value="plans"
                                    icon={<Map16Regular />}
                                    aria-label="Plans Tab"
                                    title="Plans Tab"
                                >
                                    Plans
                                </Tab>
                                <Tab
                                    data-testid="personaTab"
                                    id="persona"
                                    value="persona"
                                    icon={<Person16Regular />}
                                    aria-label="Persona Tab"
                                    title="Persona Tab"
                                >
                                    Persona
                                </Tab>
                            </>
                        )}
                    </TabList>
                </div>
                <div className={classes.controls}>
                    {!features[FeatureKeys.SimplifiedExperience].enabled && (
                        <div data-testid="chatParticipantsView">
                            <ParticipantsList participants={conversations[selectedId].users} />
                        </div>
                    )}
                    {showShareBotMenu && (
                        <div>
                            <ShareBotMenu chatId={selectedId} chatTitle={chatName} />
                        </div>
                    )}
                </div>
            </div>
            {selectedTab === 'chat' && <ChatRoom />}
            {selectedTab === 'documents' && <DocumentsTab />}
            {selectedTab === 'plans' && (
                <PlansTab
                    setChatTab={() => {
                        setSelectedTab('chat');
                    }}
                />
            )}
            {selectedTab === 'rag' && <RagTab onTabChange={setSelectedTab} />}
            {selectedTab === 'persona' && <PersonaTab />}
            {selectedTab !== 'chat' && (
                <div className={classes.alerts}>
                    <Alerts />
                </div>
            )}
        </div>
    );
};
