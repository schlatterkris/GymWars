interface TokenClient {
  requestAccessToken(config: { prompt: string }): void;
  callback: (resp: { access_token?: string; error?: string }) => void;
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient(config: {
          client_id: string;
          scope: string;
          callback: (resp: { access_token?: string; error?: string }) => void;
        }): TokenClient;
      };
    };
  };
}
