import { useEffect, useState } from "react";
import { Box, IconButton, Paper } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import {
    useColors,
    useMaxIterations,
    useShowInfo,
    useX,
    useY,
    useZ,
    useGradientFunction,
} from "../hooks/state";
import { encodeColors } from "../utilities/colors";

export const InfoPanel = () => {
    const [isOpen, setIsOpen] = useShowInfo();
    const [x] = useX();
    const [y] = useY();
    const [z] = useZ();
    const [maxIterations] = useMaxIterations();
    const [gradientFunction] = useGradientFunction();
    const [colors] = useColors();
    const [url, setUrl] = useState(null);
    const [displayUrl, setDisplayUrl] = useState(null);

    useEffect(() => {
        const baseUrl = window.location.origin;
        setUrl(
            `${baseUrl}/?x=${x}&y=${y}&z=${z}&maxIterations=${maxIterations}&colors=${encodeColors(colors)}&gradientFunction=${gradientFunction}`
        );
        setDisplayUrl(
            `${baseUrl}/?\nx=${x}&\ny=${y}&\nz=${z}&\nmaxIterations=${maxIterations}&\ncolors=${encodeColors(colors)}&\ngradientFunction=${gradientFunction}`
        );
    }, [x, y, z, maxIterations, colors]);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(url);
    };
    const handleClose = () => {
        setIsOpen(false);
    };
    return (
        <div>
            {isOpen && (
                <Box
                    sx={{
                        zIndex: 999999,
                        backgroundColor: "white",
                        padding: 2,
                        position: "absolute",
                        top: 60,
                        left: 42,
                        width: "auto",
                        maxWidth: "80vw",
                    }}
                >
                    <Paper>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box
                                sx={{
                                    padding: 2,
                                    flexGrow: 1,
                                    fontFamily: "monospace",
                                    fontSize: "14px",
                                    overflowWrap: "break-word",
                                }}
                            >
                                <pre>{displayUrl}</pre>
                            </Box>
                            <IconButton onClick={handleCopyUrl}>
                                <FileCopyIcon fontSize="small" />
                            </IconButton>
                            <IconButton onClick={handleClose}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Paper>
                </Box>
            )}
        </div>
    );
};
