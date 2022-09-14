
const runTimeDependencies = {
    "load": {
        "rxjs": "^6.5.5"
    },
    "differed": {},
    "includedInBundle": []
}
const externals = {
    "rxjs": {
        "commonjs": "rxjs",
        "commonjs2": "rxjs",
        "root": "rxjs_APIv6"
    },
    "rxjs/operators": {
        "commonjs": "rxjs/operators",
        "commonjs2": "rxjs/operators",
        "root": [
            "rxjs_APIv6",
            "operators"
        ]
    }
}
const exportedSymbols = {
    "rxjs": {
        "apiKey": "6",
        "exportedSymbol": "rxjs"
    }
}
export const setup = {
    name:'@youwol/flux-view',
        assetId:'QHlvdXdvbC9mbHV4LXZpZXc=',
    version:'1.0.3',
    shortDescription:"Tiny library to render HTML documents using reactive programing primitives.",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/flux-view',
    npmPackage:'https://www.npmjs.com/package/@youwol/flux-view',
    sourceGithub:'https://github.com/youwol/flux-view',
    userGuide:'https://l.youwol.com/doc/@youwol/flux-view',
    apiVersion:'1',
    runTimeDependencies,
    externals,
    exportedSymbols,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    }
}
