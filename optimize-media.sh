#!/bin/bash

# ==============================================================================
# SCRIPT DE OTIMIZAÇÃO DE MÍDIA GMAD TV
# ==============================================================================
# Este script comprime todos os vídeos e imagens nas pastas das cidades
# para garantir que a Smart TV não trave e o projeto fique leve.
#
# REQUISITO: ffmpeg instalado (sudo apt install ffmpeg)
# ==============================================================================

# Verifica se o ffmpeg está instalado
if ! command -v ffmpeg &> /dev/null
then
    echo "❌ Erro: ffmpeg não encontrado."
    echo "Instale com: sudo apt update && sudo apt install ffmpeg -y"
    exit 1
fi

BASE_DIR="$(pwd)/public"
CITIES=("madville" "curitiba" "default")

echo "🚀 Iniciando otimização de mídia..."

for city in "${CITIES[@]}"; do
    CITY_PATH="$BASE_DIR/$city"
    
    if [ ! -d "$CITY_PATH" ]; then
        continue
    fi

    echo "---------------------------------------------------"
    echo "🏙️  Cidade: $city"
    echo "---------------------------------------------------"

    # --- Otimização de Vídeos (MP4) ---
    for f in "$CITY_PATH"/*.mp4; do
        [ -e "$f" ] || continue
        filename=$(basename "$f")
        
        # Ignora arquivos que já foram otimizados recentemente se quiser (opcional)
        echo "🎥 Comprimindo: $filename"
        
        # CRF 32 para garantir que fique abaixo de 25MB na Cloudflare
        # -vcodec libx264 para compatibilidade com TVs antigas
        # -acodec mp3 para áudio leve e compatível
        ffmpeg -y -i "$f" -vcodec libx264 -crf 32 -preset faster -acodec mp3 "${f}.tmp.mp4" -hide_banner -loglevel error
        
        if [ $? -eq 0 ]; then
            mv "${f}.tmp.mp4" "$f"
            echo "✅ Concluído: $filename"
        else
            echo "❌ Erro ao comprimir $filename"
            rm "${f}.tmp.mp4" 2>/dev/null
        fi
    done

    # --- Otimização de Imagens (PNG/JPG para JPG leve) ---
    for img in "$CITY_PATH"/*.{png,jpg,jpeg}; do
        [ -e "$img" ] || continue
        img_name=$(basename "$img")
        
        # Se for um PNG muito grande ou JPG pesado, converte para JPG 70%
        echo "🖼️  Otimizando imagem: $img_name"
        
        ffmpeg -y -i "$img" -q:v 5 "${img%.*}.jpg" -hide_banner -loglevel error
        
        if [ $? -eq 0 ]; then
            # Se o arquivo original era PNG, remove o PNG antigo
            if [[ "$img" == *.png ]]; then
                rm "$img"
                echo "♻️  PNG convertido para JPG: $img_name"
            else
                echo "✅ JPG otimizado: $img_name"
            fi
        fi
    done
done

echo ""
echo "==================================================="
echo "✨ Otimização finalizada com sucesso! ✨"
echo "Agora você pode rodar o deploy para subir os arquivos leves."
echo "==================================================="
