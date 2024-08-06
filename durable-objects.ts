interface Env {
	EchoDo: DurableObjectNamespace;
}

/**
 * no-op fetch handler as we only use the durable object from this service.
 */
export default {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async fetch(_request: Request, _env: Env, _ctx: ExecutionContext) {
		return new Response(null, { status: 200 });
	},
};

// FIXME: use environment variable to share with app
const CLOSE_KEYWORD = 'r000b090j32qjf';

export class EchoDo {
	state: DurableObjectState;
  sessionMap: Map<string, WebSocket>;
  idMap: Map<WebSocket, string>;
  selfIdMap: Map<WebSocket, string>;

	constructor(state: DurableObjectState) {
		this.state = state;
    this.sessionMap = new Map();
    this.idMap = new Map();
    this.selfIdMap = new Map();
	}

	async fetch(request: Request) {
		const url = new URL(request.url);
		const fromId = url.searchParams.get("fromId");
		const toId = url.searchParams.get("toId");
		if (!toId || !fromId) {
			return new Response(null, { status: 400 });
		}

		switch (url.pathname) {
			case "/join": {
				const client = this.join(fromId, toId);

				return new Response(null, { status: 101, webSocket: client });
			}
			case "/broadcast": {
				break;
			}
			default: {
				return new Response(null, { status: 404 });
			}
		}
	}

	join(selfId: string, toId: string) {
		const oldServer = this.sessionMap.get(selfId);
		if (oldServer) {
			this.idMap.delete(oldServer);
			this.selfIdMap.delete(oldServer);
			this.sessionMap.delete(selfId);
			oldServer.send('Detected a new connection from another device, closing...');
			oldServer.close(1011, 'Detected a new connection from another device, closing...');
		}
		const { 0: client, 1: server } = new WebSocketPair();
		this.state.acceptWebSocket(server);

		this.sessionMap.set(selfId, server);
		this.idMap.set(server, toId);
		this.selfIdMap.set(server, selfId);

		return client;
	}

	webSocketMessage(ws: WebSocket, message: string) {
		if (message === CLOSE_KEYWORD) {
			ws.close(1000, 'Closing...');
			console.log('closing...');
			this.idMap.delete(ws);
			const selfId = this.selfIdMap.get(ws);
			if (selfId) {
				this.sessionMap.delete(selfId);
			}
			this.selfIdMap.delete(ws);
			return;
		}
		const server = this.sessionMap.get(this.idMap.get(ws) ?? '');
		if (server) {
			server.send(message);
		}
	}
}
