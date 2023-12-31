<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInitd14f01e072483a2225e27f288f6a694b
{
    public static $prefixLengthsPsr4 = array (
        'D' => 
        array (
            'DLXPlugins\\PMProTurnstile\\' => 26,
        ),
    );

    public static $prefixDirsPsr4 = array (
        'DLXPlugins\\PMProTurnstile\\' => 
        array (
            0 => __DIR__ . '/../..' . '/includes',
        ),
    );

    public static $classMap = array (
        'Composer\\InstalledVersions' => __DIR__ . '/..' . '/composer/InstalledVersions.php',
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixLengthsPsr4 = ComposerStaticInitd14f01e072483a2225e27f288f6a694b::$prefixLengthsPsr4;
            $loader->prefixDirsPsr4 = ComposerStaticInitd14f01e072483a2225e27f288f6a694b::$prefixDirsPsr4;
            $loader->classMap = ComposerStaticInitd14f01e072483a2225e27f288f6a694b::$classMap;

        }, null, ClassLoader::class);
    }
}
