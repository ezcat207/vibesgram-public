#!/bin/bash

# Exit on any error
set -e

# Handle interrupt signal
trap 'echo -e "\nScript interrupted"; exit 1' INT

# skip build if NO_BUILD=1
if [ "${NO_BUILD:-0}" != "1" ]; then
    # if can't build, exit
    pnpm --filter vibesgram build || exit 1
fi

# 获取所有tag并按版本号排序
LATEST_TAG=$(git tag -l | sort -V | tail -n 1)

if [ -z "$LATEST_TAG" ]; then
    # 如果没有tag，从v0.0.1开始
    NEW_TAG="v0.0.1"
else
    # 提取版本号部分（去掉v前缀）
    VERSION=${LATEST_TAG#v}
    
    # 分割版本号
    IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"
    
    # 增加patch版本
    PATCH=$((PATCH + 1))
    
    # 组合新的版本号
    NEW_TAG="v$MAJOR.$MINOR.$PATCH"
fi

# 创建并推送新tag
echo "Creating new tag: $NEW_TAG"
git tag $NEW_TAG && git push origin $NEW_TAG || exit 1

echo "Successfully created and pushed tag $NEW_TAG"

# 推送当前分支到远程
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
echo "Pushing current branch: $CURRENT_BRANCH"
git push origin $CURRENT_BRANCH || exit 1

echo "Successfully pushed branch $CURRENT_BRANCH"