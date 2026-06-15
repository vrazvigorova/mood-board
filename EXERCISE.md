# Container Networking

Make sure containers are running:

```bash
docker compose up -d
docker ps
```

## 1. Inspect the Network

See what networks Compose created:

```bash
docker network ls
```

See which containers are on the default network and their IPs:

```bash
docker network inspect mood-board_default
```

## 2. Get the IP of Each Container

```bash
docker inspect mood-board-db-1 --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
# 172.18.0.2

docker inspect mood-board-next-1 --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
# 172.18.0.4

docker inspect mood-board-server-1 --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
# 172.18.0.3
```

## 3. Ping Between Containers by Service Name

Docker has built-in DNS — service names resolve to IPs automatically:

```bash
docker exec -it mood-board-next-1 sh
ping db -c 4
ping server -c 4
exit
```

## 4. Ping by IP Instead of Name

Shell variables don't transfer into containers — pass the IP directly:

```bash
docker exec -it mood-board-next-1 ping 172.18.0.2 -c 4
```

## 5. Check What Postgres is Listening On

netstat is not available in the postgres image — use docker port instead:

```bash
docker port mood-board-db-1
# 5432/tcp ->
```

- docker network ls → see all networks Compose created
- docker network inspect → see containers and IPs on each network
- docker inspect --format → get a specific container's IP
- docker exec ... ping db → Docker DNS resolves service names to IPs
- docker exec ... ping 172.x → connectivity works by IP too
- docker port → see what interfaces a service is listening on
- Shell variables do NOT transfer into containers via docker exec
