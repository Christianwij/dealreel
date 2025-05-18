import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from fastapi import Request
from typing import Callable, Any
import functools
import time
import logging

logger = logging.getLogger(__name__)

def init_monitoring(dsn: str | None = None) -> None:
    """Initialize monitoring with Sentry"""
    if not dsn:
        logger.warning("Sentry DSN not provided, monitoring disabled")
        return

    sentry_sdk.init(
        dsn=dsn,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        environment="production",
        
        # Configure error filtering
        before_send=before_send,
        
        # Enable performance monitoring
        enable_tracing=True,
    )

def before_send(event: dict, hint: dict) -> dict | None:
    """Filter and modify events before sending to Sentry"""
    if 'exc_info' in hint:
        exc_type, exc_value, _ = hint['exc_info']
        
        # Ignore certain types of errors
        if exc_type.__name__ in ['ConnectionError', 'TimeoutError']:
            return None
            
        # Add custom tags for error types
        event['tags'] = event.get('tags', {})
        event['tags']['error_type'] = exc_type.__name__
        
    return event

def monitor_endpoint(endpoint_name: str) -> Callable:
    """Decorator to monitor FastAPI endpoint performance and errors"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Extract request object if present
            request = next((arg for arg in args if isinstance(arg, Request)), None)
            
            with sentry_sdk.start_transaction(
                op="http.server",
                name=f"endpoint.{endpoint_name}",
            ) as transaction:
                try:
                    start_time = time.time()
                    result = await func(*args, **kwargs)
                    duration = time.time() - start_time
                    
                    # Add performance data
                    transaction.set_data("duration", duration)
                    if request:
                        transaction.set_data("method", request.method)
                        transaction.set_data("url", str(request.url))
                    
                    return result
                except Exception as e:
                    # Capture exception with context
                    with sentry_sdk.push_scope() as scope:
                        if request:
                            scope.set_context("request", {
                                "method": request.method,
                                "url": str(request.url),
                                "headers": dict(request.headers),
                            })
                        scope.set_tag("endpoint", endpoint_name)
                        sentry_sdk.capture_exception(e)
                    raise
                
        return wrapper
    return decorator

def monitor_task(task_name: str) -> Callable:
    """Decorator to monitor background task performance and errors"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            with sentry_sdk.start_transaction(
                op="task",
                name=f"task.{task_name}",
            ) as transaction:
                try:
                    start_time = time.time()
                    result = await func(*args, **kwargs)
                    duration = time.time() - start_time
                    
                    # Add performance data
                    transaction.set_data("duration", duration)
                    transaction.set_data("args", str(args))
                    transaction.set_data("kwargs", str(kwargs))
                    
                    return result
                except Exception as e:
                    # Capture exception with context
                    with sentry_sdk.push_scope() as scope:
                        scope.set_context("task", {
                            "name": task_name,
                            "args": args,
                            "kwargs": kwargs,
                        })
                        scope.set_tag("task_type", task_name)
                        sentry_sdk.capture_exception(e)
                    raise
                
        return wrapper
    return decorator 