import { GetSignedUrlConfig, Storage } from '@google-cloud/storage';
import _ from 'lodash';
import type { NextApiRequest, NextApiResponse } from 'next';

const isDev = process.env.NODE_ENV;

const logFilesBucket = isDev ? 'wowarenalogs-public-dev-log-files-dev' : 'wowarenalogs-log-files-prod';

let storage = new Storage(
  isDev
    ? {
        // This file is in gitignore so we can't import it normally without build errs
        // TODO: fix issue with local dev using local service acct causing builds to fail
        credentials: require('../../gcp_service_account.json'),
      }
    : {},
);

const bucket = storage.bucket(logFilesBucket);

const extensionHeaders = {
  'x-goog-meta-ownerid': '',
  'x-goog-meta-wow-version': '',
  'x-goog-meta-wow-patch-rev': '',
  'x-goog-meta-starttime-utc': '',
  'x-goog-meta-client-timezone': '',
  'x-goog-meta-client-year': '',
};

const signedUrlConfig: GetSignedUrlConfig = {
  action: 'write',
  expires: '03-01-2500',
  contentType: 'text/plain;charset=UTF-8',
  extensionHeaders,
};

export const combatUploadSignatureHandler = (request: NextApiRequest, response: NextApiResponse) => {
  const { id } = request.query;
  const file = bucket.file(id as string);

  if (request.method === 'GET') {
    if (signedUrlConfig.extensionHeaders) {
      _.keys(extensionHeaders).forEach((k) => {
        if (signedUrlConfig.extensionHeaders) {
          signedUrlConfig.extensionHeaders[k] = request.headers[k];
        }
      });
    } else {
      return response.status(400).json({ error: 'x-goog-meta-ownerid header is required.' });
    }
    return new Promise((resolve) => {
      file.getSignedUrl(signedUrlConfig, function (err, url) {
        if (err) {
          // eslint-disable-next-line no-console
          console.log(err);
          resolve(response.status(500).json({ error: 'An error has occurred' }));
        } else {
          resolve(response.status(200).json({ url, parsedName: id }));
        }
      });
    });
  } else {
    return response.status(400).json({ error: 'Only GET requests are allowed.' });
  }
};