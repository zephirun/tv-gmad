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
        
        echo "🎥 Comprimindo: $filename"
        
        # Codec de vídeo: H.264 Baseline profile (máxima compatibilidade WebOS/TVs antigas)
        # Codec de áudio: AAC (MP3 no container MP4 NÃO é suportado pelo WebOS)
        # -movflags +faststart: mova o índice para o início do arquivo (streaming progressivo)
        # CRF 32: compressão agressiva para caber no limite de 25MB do Cloudflare Pages
        ffmpeg -y -i "$f" \
            -vcodec libx264 -profile:v baseline -level 3.1 -crf 32 -preset faster \
            -acodec aac -b:a 96k -ar 44100 \
            -movflags +faststart \
            "${f}.tmp.mp4" -hide_banner -loglevel error
        
        if [ $? -eq 0 ]; then
            # Verificar tamanho do arquivo resultante (limite 25MB do Cloudflare Pages)
            SIZE_BYTES=$(stat -c%s "${f}.tmp.mp4")
            MAX_BYTES=$((25 * 1024 * 1024))  # 25MB em bytes
            
            if [ "$SIZE_BYTES" -gt "$MAX_BYTES" ]; then
                SIZE_MB=$(echo "scale=1; $SIZE_BYTES / 1048576" | bc)
                echo "⚠️  IGNORADO: $filename ainda ficou ${SIZE_MB}MB após compressão (limite: 25MB)"
                echo "   → Hospede este vídeo externamente (YouTube ou Supabase Storage)"
                rm "${f}.tmp.mp4"
                rm "$f"   # Remove da pasta public para não tentar subir
            else
                mv "${f}.tmp.mp4" "$f"
                SIZE_MB=$(echo "scale=1; $SIZE_BYTES / 1048576" | bc)
                echo "✅ Concluído: $filename (${SIZE_MB}MB)"
            fi
        else
            echo "❌ Erro ao comprimir $filename (arquivo pode estar corrompido)"
            rm "${f}.tmp.mp4" 2>/dev/null
            rm "$f"   # Remove arquivo corrompido da pasta public
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
