from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import Template, PackageType, Dependencies, \
    RunTimeDeps, generate_template

template = Template(
    path=Path(__file__).parent,
    type=PackageType.Library,
    name="@youwol/flux-view",
    version="0.1.2-wip",
    shortDescription="Tiny library to render HTML documents using reactive programing primitives.",
    author="greinisch@youwol.com",
    dependencies=Dependencies(
        runTime=RunTimeDeps(
            load={
                "rxjs": "^6.5.5"
            }
        ),
        devTime={
            "rxjs-spy": "7.5.3"
        }),
    userGuide=True
    )

generate_template(template)
