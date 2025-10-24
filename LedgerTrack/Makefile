.DEFAULT_GOAL := help
.PHONY: help init-expo install start-expo shell clean

help:
	@echo "Commandes disponibles :"
	@echo "  make init-expo PROJECT_NAME=MonApp   # Crée un projet Expo"
	@echo "  make install                        # Installe les dépendances"
	@echo "  make start-expo                     # Démarre Expo"
	@echo "  make shell                          # Shell interactif dans le container"
	@echo "  make clean                          # Supprime volumes/dépendances Docker"

init-expo:
	@echo "🚀 Initialisation d'un projet Expo : $(PROJECT_NAME)"
	docker-compose run --rm cli npx create-expo-app@latest $(PROJECT_NAME)
	@echo "✅ Projet $(PROJECT_NAME) créé !"

install:
	@echo "📦 Installation des dépendances..."
	docker-compose run --rm cli npm install

start-expo:
	@echo "🎯 Démarrage serveur Expo..."
	docker-compose run --rm -p 19000:19000 -p 19001:19001 -p 19002:19002 -p 19006:19006 cli npx expo start --tunnel

shell:
	docker-compose run --rm cli sh

clean:
	docker-compose down -v
	docker volume prune -f
	rm -rf node_modules
