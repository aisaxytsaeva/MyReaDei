from redis.asyncio import Redis


class RefreshStore:
    def __init__(self, redis: Redis):
        self.redis = redis

    def _rt_key(self, jti: str) -> str:
        return f"rt:{jti}"

    def _user_key(self, user_id: int) -> str:
        return f"rt_user:{user_id}"

    async def add(self, *, jti: str, user_id: int, ttl_seconds: int):
        await self.redis.set(self._rt_key(jti), str(user_id), ex=ttl_seconds)
        await self.redis.sadd(self._user_key(user_id), jti)

    async def get_user_id(self, jti: str) -> int | None:
        v = await self.redis.get(self._rt_key(jti))
        return int(v) if v is not None else None

    async def revoke(self, *, jti: str, user_id: int | None = None):
        await self.redis.delete(self._rt_key(jti))
        if user_id is not None:
            await self.redis.srem(self._user_key(user_id), jti)

    async def revoke_all(self, user_id: int) -> int:
        user_key = self._user_key(user_id)
        jtis = await self.redis.smembers(user_key)
        if not jtis:
            await self.redis.delete(user_key)
            return 0
        keys = [self._rt_key(jti) for jti in jtis]
        await self.redis.delete(*keys)
        await self.redis.delete(user_key)
        return len(jtis)
