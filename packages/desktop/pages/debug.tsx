import { Button, useAuth } from '@wowarenalogs/shared';
import { useClientContext } from '@wowarenalogs/shared';
import { useGetMyMatchesQuery, useGetProfileQuery } from '@wowarenalogs/shared/src/graphql/__generated__/graphql';

import { LoginButton } from '../components/Login/LoginButton';
import { LogoutButton } from '../components/Login/LogoutButton';
import { useAppConfig } from '../hooks/AppConfigContext';
import { useLocalCombats } from '../hooks/LocalCombatsContext';

const Debug = () => {
  const auth = useAuth();

  const platform = typeof window !== 'undefined' ? window.wowarenalogs.platform : '';

  const client = useClientContext();
  const { updateAppConfig, wowInstallations } = useAppConfig();
  const combats = useLocalCombats();

  const profileQuery = useGetProfileQuery();
  const matchesQuery = useGetMyMatchesQuery();

  return (
    <div className="mt-8 text-base-content">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <div>Platform: {platform}</div>
          <div>Auth: {auth.isLoadingAuthData ? 'loading' : auth.battleTag || 'not-logged-in'}</div>
          <div>
            {wowInstallations.size} Installations
            {Array.from(wowInstallations).map((v) => (
              <div key={v[0]}>{v.join(': ')}</div>
            ))}
          </div>
          <div>Local combat logs: ({combats.localCombats.length} total)</div>
          {combats.localCombats.map((e) => (
            <div key={e.id}>
              start-{e.startTime} zone-{e.startInfo.zoneId} bracket-{e.startInfo.bracket} result-{e.result}
            </div>
          ))}
        </div>
        <div className="flex flex-col">
          <b>GQL</b>
          <div>
            useGetProfile
            <ul>
              <li>loading:{profileQuery.loading.toString()}</li>
              <li>
                data: <pre>{JSON.stringify(profileQuery.data?.me || {}, null, 2)}</pre>
              </li>
            </ul>
          </div>
          <div>
            matchesQuery
            <ul>
              <li>loading:{matchesQuery.loading.toString()}</li>
              <li>data: {matchesQuery.data?.myMatches.combats.length} matches</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col">
          <LoginButton />
          <LogoutButton />
          <Button
            onClick={() => {
              window.wowarenalogs.links?.openExternalURL('https://worldofwarcraft.com/en-us/');
            }}
          >
            Test Open External URL
          </Button>
          <Button
            onClick={() => {
              window.wowarenalogs.fs
                ?.selectFolder()
                .then((folder) => {
                  updateAppConfig((prev) => {
                    return { ...prev, wowDirectory: folder };
                  });
                })
                .catch(() => {});
            }}
          >
            Select WoW Folder (installs addon, starts loggers)
          </Button>
          <Button
            onClick={() => {
              updateAppConfig((prev) => {
                return { ...prev, wowDirectory: undefined };
              });
            }}
          >
            Clear WoW Folder Setting
          </Button>
          <Button
            onClick={() => {
              client.saveWindowPosition();
            }}
          >
            Save Window Pos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Debug;
