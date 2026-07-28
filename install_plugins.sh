#!/bin/bash

PLUGIN_DIR="/Applications/MemoryAnalyzer.app/Contents/Eclipse/plugins"

for jar in "$PLUGIN_DIR"/*.jar
do
    filename=$(basename "$jar")

    artifact=$(echo "$filename" | sed -E 's/_([0-9].*)\.jar$//')

    version=$(echo "$filename" | sed -E 's/^.*_([0-9].*)\.jar$/\1/')

    groupId=$(echo "$artifact" | awk -F. '{
        if ($1=="org" && $2=="eclipse")
            print "org.eclipse."$3;
        else
            print "local";
    }')

    echo "Installing $artifact:$version"

    mvn install:install-file \
      -Dfile="$jar" \
      -DgroupId="$groupId" \
      -DartifactId="$artifact" \
      -Dversion="$version" \
      -Dpackaging=jar >/dev/null

done

echo "Done."