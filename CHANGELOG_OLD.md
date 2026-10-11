# Older changes
## 1.1.3 (2025-06-05)
* Fix out of memory while scanning

## 1.1.2 (2025-04-21)
* (Jey Cee) Add meta object object for instance to store device pictures from device manager
* (Jey Cee) Fix repository checker errors

## 1.1.1 (2025-03-13)
* (Jey Cee) Fix "Cannot read properties of undefined (reading 'find')"

## 1.1.0 (2025-02-04)
* (Jey Cee) New feature ignore list for autodiscovery
* (Jey Cee) New feature Wake-on-LAN with IP for devices on other subnets
* (Jey Cee) Optimize config for better responsive behavior
* (Jey Cee) Sync license key on all instance configurations if a key was already entered in one instance configuration
* (Jey Cee) Moved translations from configuration interface to i18n files
* (Jey Cee) Update dependencies
* (Jey Cee) Fix some stuff that was mentoined by adapter checker

## 1.0.11 27.03.2024
* (Jey Cee) Fix high CPU load while running discovering devices

## 1.0.9 19.03.2024
* (Jey Cee) Fix unexpected stop of discovery

## 1.0.6 04.03.2024
* (Jey Cee) Reduce system load during discovery process to prevent adapter crash

## 1.0.5 04.02.2024
* (Jey Cee) remove discovery adapter as dependency
* (Jey Cee) add possibility to choose the interface which will be used for ping operations
* (Jey Cee) add possibility to enter IP range for device discovery
* (Jey Cee) add auto search by configurable schedule
* (Jey Cee) fix/catch crash if device was deleted in objects and not in device management
* (Jey Cee) fix ping rights on lxc containers which prevent to ping devices

## 1.0.2 20.01.2024
* (Jey Cee) bugfix require

## 1.0.1 19.01.2024
* (Jey Cee) add device manager to configuration
* (Jey Cee) add use of license
