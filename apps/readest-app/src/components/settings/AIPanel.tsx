import clsx from 'clsx';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PiCheckCircle, PiWarningCircle, PiArrowsClockwise, PiSpinner } from 'react-icons/pi';

import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import { useEnv } from '@/context/EnvContext';
import { getAIProvider } from '@/services/ai/providers';
import {
  fetchOpenRouterModels,
  type OpenRouterModelInfo,
} from '@/services/ai/providers/OpenRouterProvider';
import { DEFAULT_AI_SETTINGS } from '@/services/ai/constants';
import type { AISettings, AIProviderName } from '@/services/ai/types';
import { exportReedyMetricsBundle } from '@/services/reedy/instrumentation';
import { isTauriAppPlatform } from '@/services/environment';
import { BoxedList, SettingLabel, SettingsRow, SettingsSwitchRow } from './primitives';

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

const AIPanel: React.FC = () => {
  const _ = useTranslation();
  const { envConfig, appService } = useEnv();
  const { settings, setSettings, saveSettings } = useSettingsStore();

  const aiSettings: AISettings = settings?.aiSettings ?? DEFAULT_AI_SETTINGS;

  const [enabled, setEnabled] = useState(aiSettings.enabled);
  const [reedyEnabled, setReedyEnabled] = useState(aiSettings.reedy?.enabled ?? false);
  const [reedyAgentRuntime, setReedyAgentRuntime] = useState(
    (aiSettings.reedy?.runtime ?? 'mvp') === 'agent',
  );
  const [provider, setProvider] = useState<AIProviderName>(aiSettings.provider);
  const [ollamaUrl, setOllamaUrl] = useState(aiSettings.ollamaBaseUrl);
  const [ollamaModel, setOllamaModel] = useState(aiSettings.ollamaModel);
  const [ollamaEmbeddingModel, setOllamaEmbeddingModel] = useState(aiSettings.ollamaEmbeddingModel);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  // ---- OpenRouter (OpenAI-compatible) state ----
  const [openrouterKey, setOpenrouterKey] = useState(aiSettings.openrouterApiKey ?? '');
  const [openrouterUrl, setOpenrouterUrl] = useState(
    aiSettings.openrouterBaseUrl ?? DEFAULT_AI_SETTINGS.openrouterBaseUrl ?? '',
  );
  const [openrouterModel, setOpenrouterModel] = useState(aiSettings.openrouterModel ?? '');
  const [openrouterEmbeddingModel, setOpenrouterEmbeddingModel] = useState(
    aiSettings.openrouterEmbeddingModel ?? '',
  );
  const [openrouterModels, setOpenrouterModels] = useState<OpenRouterModelInfo[]>([]);
  const [openrouterFetchingModels, setOpenrouterFetchingModels] = useState(false);
  const [openrouterModelsError, setOpenrouterModelsError] = useState('');

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const isMounted = useRef(false);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const saveAiSetting = useCallback(
    async (key: keyof AISettings, value: AISettings[keyof AISettings]) => {
      const currentSettings = settingsRef.current;
      if (!currentSettings) return;
      const currentAiSettings: AISettings = currentSettings.aiSettings ?? DEFAULT_AI_SETTINGS;
      const newAiSettings: AISettings = { ...currentAiSettings, [key]: value };
      const newSettings = { ...currentSettings, aiSettings: newAiSettings };

      setSettings(newSettings);
      await saveSettings(envConfig, newSettings);
    },
    [envConfig, setSettings, saveSettings],
  );

  const fetchOllamaModels = useCallback(async () => {
    if (!ollamaUrl || !enabled) return;

    setFetchingModels(true);
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      const models = data.models?.map((m: { name: string }) => m.name) || [];

      setOllamaModels(models);
      if (models.length > 0 && !models.includes(ollamaModel)) {
        setOllamaModel(models[0]!);
      }
    } catch (_err) {
      setOllamaModels([]);
    } finally {
      setFetchingModels(false);
    }
  }, [ollamaUrl, ollamaModel, enabled]);

  useEffect(() => {
    if (provider === 'ollama' && enabled) {
      fetchOllamaModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, enabled, ollamaUrl]);

  // ---- OpenRouter: fetch /models list ----
  const fetchOpenrouterModelList = useCallback(async () => {
    if (!enabled || !openrouterUrl || !openrouterKey) {
      setOpenrouterModels([]);
      return;
    }
    setOpenrouterFetchingModels(true);
    setOpenrouterModelsError('');
    try {
      const models = await fetchOpenRouterModels(openrouterUrl, openrouterKey);
      // Sort by id for a stable picker. Keep raw entries — UI uses
      // `name || id` so OpenRouter's friendly labels still show up.
      models.sort((a, b) => a.id.localeCompare(b.id));
      setOpenrouterModels(models);
      if (models.length > 0 && !models.some((m) => m.id === openrouterModel)) {
        setOpenrouterModel(models[0]!.id);
      }
    } catch (e) {
      setOpenrouterModels([]);
      setOpenrouterModelsError((e as Error).message || _('Failed to fetch models'));
    } finally {
      setOpenrouterFetchingModels(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, openrouterUrl, openrouterKey, openrouterModel]);

  useEffect(() => {
    if (provider === 'openrouter' && enabled && openrouterKey && openrouterUrl) {
      fetchOpenrouterModelList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, enabled, openrouterKey, openrouterUrl]);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    if (enabled !== aiSettings.enabled) {
      saveAiSetting('enabled', enabled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!isMounted.current) return;
    if (provider !== aiSettings.provider) {
      saveAiSetting('provider', provider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  useEffect(() => {
    if (!isMounted.current) return;
    if (ollamaUrl !== aiSettings.ollamaBaseUrl) {
      saveAiSetting('ollamaBaseUrl', ollamaUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ollamaUrl]);

  useEffect(() => {
    if (!isMounted.current) return;
    if (ollamaModel !== aiSettings.ollamaModel) {
      saveAiSetting('ollamaModel', ollamaModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ollamaModel]);

  useEffect(() => {
    if (!isMounted.current) return;
    if (ollamaEmbeddingModel !== aiSettings.ollamaEmbeddingModel) {
      saveAiSetting('ollamaEmbeddingModel', ollamaEmbeddingModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ollamaEmbeddingModel]);

  // ---- OpenRouter save effects ----
  useEffect(() => {
    if (!isMounted.current) return;
    if (openrouterKey !== (aiSettings.openrouterApiKey ?? '')) {
      saveAiSetting('openrouterApiKey', openrouterKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openrouterKey]);

  useEffect(() => {
    if (!isMounted.current) return;
    if (openrouterUrl !== (aiSettings.openrouterBaseUrl ?? '')) {
      saveAiSetting('openrouterBaseUrl', openrouterUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openrouterUrl]);

  useEffect(() => {
    if (!isMounted.current) return;
    if (openrouterModel !== (aiSettings.openrouterModel ?? '')) {
      saveAiSetting('openrouterModel', openrouterModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openrouterModel]);

  useEffect(() => {
    if (!isMounted.current) return;
    if (openrouterEmbeddingModel !== (aiSettings.openrouterEmbeddingModel ?? '')) {
      saveAiSetting('openrouterEmbeddingModel', openrouterEmbeddingModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openrouterEmbeddingModel]);

  const handleTestConnection = async () => {
    if (!enabled) return;
    setConnectionStatus('testing');
    setErrorMessage('');

    try {
      const testSettings: AISettings = {
        ...aiSettings,
        provider,
        ollamaBaseUrl: ollamaUrl,
        ollamaModel,
        ollamaEmbeddingModel,
        openrouterApiKey: openrouterKey,
        openrouterBaseUrl: openrouterUrl,
        openrouterModel,
        openrouterEmbeddingModel,
      };
      const aiProvider = getAIProvider(testSettings);
      const isHealthy = await aiProvider.healthCheck();
      if (isHealthy) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setErrorMessage(
          provider === 'ollama'
            ? _("Couldn't connect to Ollama. Is it running?")
            : _('Invalid API key or connection failed'),
        );
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage((error as Error).message || _('Connection failed'));
    }
  };

  const disabledSection = !enabled ? 'opacity-50 pointer-events-none select-none' : '';

  return (
    <div className='my-4 w-full space-y-6'>
      <BoxedList title={_('AI Assistant')}>
        <SettingsSwitchRow
          label={_('Enable AI Assistant')}
          checked={enabled}
          onChange={() => setEnabled(!enabled)}
        />
      </BoxedList>

      <BoxedList title={_('Provider')} className={disabledSection}>
        <SettingsRow label={_('Ollama (Local)')} asLabel>
          <input
            type='radio'
            name='ai-provider'
            className='radio'
            checked={provider === 'ollama'}
            onChange={() => setProvider('ollama')}
            disabled={!enabled}
          />
        </SettingsRow>
        <SettingsRow label={_('OpenAI Compatible')} asLabel>
          <input
            type='radio'
            name='ai-provider'
            className='radio'
            checked={provider === 'openrouter'}
            onChange={() => setProvider('openrouter')}
            disabled={!enabled}
          />
        </SettingsRow>
      </BoxedList>

      {provider === 'ollama' && (
        <BoxedList title={_('Ollama Configuration')} className={disabledSection}>
          {/* Stacked-content rows: label-on-top, input below — used when the
              control is too wide to fit alongside the label (full-width text
              inputs, long selects). Custom <div> rather than <SettingsRow>
              since SettingsRow assumes label-left/control-right. */}
          <div className='flex flex-col gap-2 py-3 pe-4'>
            <div className='flex w-full items-center justify-between'>
              <SettingLabel>{_('Server URL')}</SettingLabel>
              <button
                className='hover:bg-base-200 inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150'
                onClick={fetchOllamaModels}
                disabled={!enabled || fetchingModels}
                title={_('Refresh Models')}
                aria-label={_('Refresh Models')}
              >
                <PiArrowsClockwise className='size-4' />
              </button>
            </div>
            <input
              type='text'
              className='input input-sm w-full'
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder='http://127.0.0.1:11434'
              disabled={!enabled}
            />
          </div>
          {ollamaModels.length > 0 ? (
            <>
              <div className='flex flex-col gap-2 py-3 pe-4'>
                <SettingLabel>{_('AI Model')}</SettingLabel>
                <select
                  className='select select-sm bg-base-100 text-base-content w-full'
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  disabled={!enabled}
                >
                  {ollamaModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              <div className='flex flex-col gap-2 py-3 pe-4'>
                <SettingLabel>{_('Embedding Model')}</SettingLabel>
                <select
                  className='select select-sm bg-base-100 text-base-content w-full'
                  value={ollamaEmbeddingModel}
                  onChange={(e) => setOllamaEmbeddingModel(e.target.value)}
                  disabled={!enabled}
                >
                  {ollamaModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : !fetchingModels ? (
            <SettingsRow
              label={<span className='text-warning text-sm'>{_('No models detected')}</span>}
            />
          ) : null}
        </BoxedList>
      )}

      {provider === 'openrouter' && (
        <BoxedList
          title={_('OpenAI Compatible Configuration')}
          description={_(
            'Bring your own API key for OpenAI or any OpenAI-compatible endpoint. Also works with Together / Groq / vLLM / OpenRouter and other OpenAI-compatible services. The model list is fetched live from the endpoint you configure.',
          )}
          className={disabledSection}
        >
          {/* API key */}
          <div className='flex flex-col gap-2 pe-4 py-3'>
            <div className='flex w-full items-center justify-between'>
              <SettingLabel>{_('API Key')}</SettingLabel>
              <a
                href='https://openrouter.ai/keys'
                target='_blank'
                rel='noopener noreferrer'
                className={clsx('link text-xs', !enabled && 'pointer-events-none')}
              >
                {_('Get Key')}
              </a>
            </div>
            <input
              type='password'
              className='input input-sm w-full'
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              placeholder='sk-or-...'
              disabled={!enabled}
              autoComplete='off'
            />
          </div>

          {/* Base URL + refresh */}
          <div className='flex flex-col gap-2 pe-4 py-3'>
            <div className='flex w-full items-center justify-between'>
              <SettingLabel>{_('Base URL')}</SettingLabel>
              <button
                className='hover:bg-base-200 inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150'
                onClick={fetchOpenrouterModelList}
                disabled={!enabled || openrouterFetchingModels || !openrouterKey}
                title={_('Refresh Models')}
                aria-label={_('Refresh Models')}
              >
                {openrouterFetchingModels ? (
                  <PiSpinner className='size-4 animate-spin' />
                ) : (
                  <PiArrowsClockwise className='size-4' />
                )}
              </button>
            </div>
            <input
              type='text'
              className='input input-sm w-full'
              value={openrouterUrl}
              onChange={(e) => setOpenrouterUrl(e.target.value)}
              placeholder='https://openrouter.ai/api/v1'
              disabled={!enabled}
            />
          </div>

          {/* Model picker — populated from the endpoint's /models */}
          <div className='flex flex-col gap-2 pe-4 py-3'>
            <SettingLabel>{_('LLM Model')}</SettingLabel>
            {openrouterModels.length > 0 ? (
              <select
                className='select select-sm bg-base-100 text-base-content w-full'
                value={openrouterModel}
                onChange={(e) => setOpenrouterModel(e.target.value)}
                disabled={!enabled}
              >
                {openrouterModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ? `${m.name} (${m.id})` : m.id}
                  </option>
                ))}
              </select>
            ) : (
              // Fallback: free-text input when /models isn't reachable yet,
              // so the user isn't locked out before refreshing succeeds.
              <input
                type='text'
                className='input input-sm w-full'
                value={openrouterModel}
                onChange={(e) => setOpenrouterModel(e.target.value)}
                placeholder='openai/gpt-4o-mini'
                disabled={!enabled}
              />
            )}
            {openrouterModelsError && (
              <span className='text-error text-xs'>{openrouterModelsError}</span>
            )}
            {!openrouterModelsError && !openrouterKey && (
              <span className='text-base-content/60 text-xs'>
                {_('Enter an API key, then refresh to load available models.')}
              </span>
            )}
          </div>

          {/* Embedding model — same /models listing as the LLM picker.
              OpenAI's /v1/models doesn't tag chat vs embedding, so the two
              selects share one list and the user picks the right one.
              Falls back to free text when the list isn't loaded yet, so
              the user can still type a known ID before refreshing. */}
          <div className='flex flex-col gap-2 pe-4 py-3'>
            <SettingLabel>{_('Embedding Model')}</SettingLabel>
            {openrouterModels.length > 0 ? (
              <select
                className='select select-sm bg-base-100 text-base-content w-full'
                value={openrouterEmbeddingModel}
                onChange={(e) => setOpenrouterEmbeddingModel(e.target.value)}
                disabled={!enabled}
              >
                <option value=''>{_('None (disable RAG)')}</option>
                {openrouterModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ? `${m.name} (${m.id})` : m.id}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type='text'
                className='input input-sm w-full'
                value={openrouterEmbeddingModel}
                onChange={(e) => setOpenrouterEmbeddingModel(e.target.value)}
                placeholder='openai/text-embedding-3-small'
                disabled={!enabled}
              />
            )}
            <span className='text-base-content/60 text-xs'>
              {_(
                'Optional. Leave blank if your endpoint does not support embeddings — chat will still work but RAG features will be unavailable.',
              )}
            </span>
          </div>
        </BoxedList>
      )}

      <BoxedList
        title={_('Reedy Retrieval (Beta)')}
        className={disabledSection}
        description={
          isTauriAppPlatform()
            ? _(
                'Uses Turso vector search + CFI-anchored citations. The model decides when to look up passages instead of getting them stuffed into the system prompt.',
              )
            : _('Reedy is desktop-only in this beta. Use the Readest desktop app to try it.')
        }
      >
        <SettingsSwitchRow
          label={_('Use Reedy retrieval')}
          checked={reedyEnabled}
          disabled={!enabled || !isTauriAppPlatform()}
          onChange={() => {
            const next = !reedyEnabled;
            setReedyEnabled(next);
            saveAiSetting('reedy', {
              enabled: next,
              runtime: reedyAgentRuntime ? 'agent' : 'mvp',
            });
          }}
        />
        <SettingsSwitchRow
          label={_('Use agent runtime (experimental)')}
          checked={reedyAgentRuntime}
          disabled={!enabled || !reedyEnabled || !isTauriAppPlatform()}
          onChange={() => {
            const next = !reedyAgentRuntime;
            setReedyAgentRuntime(next);
            saveAiSetting('reedy', {
              enabled: reedyEnabled,
              runtime: next ? 'agent' : 'mvp',
            });
          }}
        />
        <div className='flex min-h-14 items-center justify-between gap-3 pe-4'>
          <div className='flex min-w-0 flex-col gap-0.5'>
            <SettingLabel>{_('Send Reedy feedback')}</SettingLabel>
          </div>
          <button
            className='btn btn-outline btn-sm'
            disabled={!enabled || !isTauriAppPlatform() || !appService}
            onClick={async () => {
              if (!appService) return;
              try {
                const bundle = await exportReedyMetricsBundle(appService);
                const blob = new Blob([bundle], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reedy-feedback-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error('[Reedy] feedback export failed', err);
              }
            }}
          >
            {_('Download')}
          </button>
        </div>
      </BoxedList>

      <BoxedList title={_('Connection')} className={disabledSection}>
        <div className='flex min-h-14 items-center justify-between gap-3 pe-4'>
          <button
            className='btn btn-outline btn-sm'
            onClick={handleTestConnection}
            disabled={!enabled || connectionStatus === 'testing'}
          >
            {_('Test Connection')}
          </button>
          <div>
            {connectionStatus === 'success' && (
              <span className='text-success flex items-center gap-1 text-sm'>
                <PiCheckCircle className='size-4 shrink-0' />
                {_('Connected')}
              </span>
            )}
            {connectionStatus === 'error' && (
              <span className='text-error flex items-center gap-1 text-sm'>
                <PiWarningCircle className='size-4 shrink-0' />
                {errorMessage || _('Failed')}
              </span>
            )}
          </div>
        </div>
      </BoxedList>
    </div>
  );
};

export default AIPanel;
