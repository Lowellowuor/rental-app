from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return Response(
            {"detail": "Internal server error.", "code": "server_error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    data = response.data

    if isinstance(data, dict) and "detail" in data and len(data) == 1:
        payload = {
            "detail": str(data["detail"]),
            "code": getattr(exc, "default_code", "error"),
        }
    else:
        payload = {
            "detail": "Validation failed.",
            "code": "validation_error",
            "fields": data,
        }

    response.data = payload
    return response
