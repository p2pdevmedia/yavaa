// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "YavaaIPhone",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "YavaaApp", targets: ["YavaaApp"]),
        .library(name: "YavaaAPI", targets: ["YavaaAPI"]),
        .library(name: "YavaaAuth", targets: ["YavaaAuth"]),
        .library(name: "YavaaCore", targets: ["YavaaCore"]),
        .library(name: "YavaaDesign", targets: ["YavaaDesign"])
    ],
    targets: [
        .target(
            name: "YavaaApp",
            dependencies: ["YavaaAPI", "YavaaAuth", "YavaaCore", "YavaaDesign"]
        ),
        .target(name: "YavaaAPI"),
        .target(name: "YavaaAuth", dependencies: ["YavaaAPI", "YavaaCore"]),
        .target(name: "YavaaCore"),
        .target(name: "YavaaDesign"),
        .testTarget(name: "YavaaAPITests", dependencies: ["YavaaAPI"]),
        .testTarget(name: "YavaaCoreTests", dependencies: ["YavaaCore"])
    ]
)
