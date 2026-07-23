import json
import sys
from contextlib import AsyncExitStack
from pathlib import Path

try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
except ImportError: 
    ClientSession = None
    StdioServerParameters = None
    stdio_client = None


class _FallbackSession:
    async def call_tool(self, tool_name, arguments=None):
        from services.recomender_service import recommend_places_service
        from services.route_service import optimize_route_service

        if tool_name == "recommend_places":
            return {
                "recommendations": recommend_places_service(
                    query=arguments.get("query", ""),
                    top_n=arguments.get("top_n", 10),
                    travel_date=arguments.get("travel_date"),
                    include_weather=arguments.get("include_weather", False),
                )["recommendations"]
            }

        if tool_name == "get_seasonality":
            return {"score": 70, "note": "Fallback seasonality score."}

        if tool_name == "get_weather":
            return {"condition": "Unknown", "temperature": None, "score": 70, "is_suitable": True, "note": "Fallback weather."}

        if tool_name == "optimize_route":
            return optimize_route_service(
                start_location=arguments.get("start_location", "Colombo"),
                end_location=arguments.get("end_location", "Colombo"),
                candidate_places=arguments.get("candidate_places", []),
                days=arguments.get("days", 3),
                daily_max_travel_hours=arguments.get("daily_max_travel_hours", 6),
                transport_type=arguments.get("transport_type", "car"),
            )

        if tool_name == "search_accommodation":
            return {
                "destination": arguments.get("destination"),
                "checkin_date": arguments.get("checkin_date"),
                "checkout_date": arguments.get("checkout_date"),
                "results": [],
                "note": "Fallback accommodation search.",
            }

        return {}

    async def list_tools(self):
        return []


class MCPTravelClient:
    def __init__(self):
        self.server_script = str(Path(__file__).parent / "mcp_server.py")
        self.session = None
        self._exit_stack = None

    async def __aenter__(self):
        if stdio_client is None or ClientSession is None or StdioServerParameters is None:
            self.session = _FallbackSession()
            return self

        self._exit_stack = AsyncExitStack()

        server_params = StdioServerParameters(
            command=sys.executable,
            args=[self.server_script],
            env=None
        )

        read_stream, write_stream = await self._exit_stack.enter_async_context(
            stdio_client(server_params)
        )

        self.session = await self._exit_stack.enter_async_context(
            ClientSession(read_stream, write_stream)
        )

        await self.session.initialize()

        return self

    async def __aexit__(self, exc_type, exc, tb):
        if self._exit_stack:
            await self._exit_stack.aclose()

    async def call_tool(self, tool_name, arguments):
        try:
            result = await self.session.call_tool(
                tool_name,
                arguments=arguments
            )
        except Exception as e:
            print(f"[MCP call_tool ERROR] tool={tool_name} args={arguments} error={e}")
            raise

        if isinstance(result, dict):
            return result

        if not getattr(result, "content", None):
            return {}

        first_content = result.content[0]
        text = getattr(first_content, "text", None)

        if text is None:
            return {"raw": str(first_content)}

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"text": text}

    async def list_tools(self):
        tools = await self.session.list_tools()
        return [
            {"name": tool.name, "description": tool.description}
            for tool in tools.tools
        ]