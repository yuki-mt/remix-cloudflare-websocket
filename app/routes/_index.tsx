import * as React from "react";
import { json } from "@remix-run/cloudflare";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getSession, commitSession } from "~/util";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const session = await getSession(request.headers.get("Cookie"));
	console.log('index', session.get("foo"));
	session.set("foo", "bar");
	return json({}, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export default function Component() {
	const socket = React.useRef<WebSocket>();
	const [messages, setMessages] = React.useState<Array<string>>([]);

	React.useEffect(() => {
		if (socket.current) return;

		const protocol = location.protocol === "http:" ? "ws:" : "wss:";
		try {
			socket.current = new WebSocket(`${protocol}//${location.host}/join${location.search}`);
			socket.current.addEventListener("message", async (e) => {
				setMessages((messages) => [...messages, e.data]);
			});
			window.onbeforeunload = () => socket.current?.send("r000b090j32qjf");
		} catch (error) {
			console.error(error);
		}
	}, []);

	return (
		<div>
			<div>Echo</div>
			<button
				onClick={() => {
					if (!socket.current) return;
					socket.current.send("chat message");
				}}
			>
				Hello!
			</button>
			<ul>
				{messages.map((message, index) => (
					<li key={index}>{message}</li>
				))}
			</ul>
		</div>
	);
}
