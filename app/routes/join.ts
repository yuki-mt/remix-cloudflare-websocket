import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getSession } from "~/util";

export async function loader({ context, request }: LoaderFunctionArgs) {
	const session = await getSession(request.headers.get("Cookie"));
	console.log('API', session.get("foo"));

	const upgradeHeader = request.headers.get("upgrade");

	if (upgradeHeader !== "websocket")
		return json({ message: "Upgrade Required" }, { status: 426 });

	const { env } = context.cloudflare;

	const chatRoom = env.EchoDo.get(env.EchoDo.idFromName("chat"));

	console.log(request.url);
	return await chatRoom.fetch(request.url, request);
}
