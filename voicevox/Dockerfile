# 公式のCPU版イメージを使用
FROM voicevox/voicevox_engine:cpu-ubuntu20.04-latest

# Koyebのデフォルトポートに合わせて公開（任意ですが推奨）
EXPOSE 50021

# 実行コマンド（デフォルトのまま）
CMD ["python3", "./run.py", "--host", "0.0.0.0"]